import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// POST /api/payments/verify  body: { reference }
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = (await request.json()) as { reference?: string };
    if (!reference) {
      return NextResponse.json(
        { error: "reference is required" },
        { status: 400 },
      );
    }

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: {
        bid: { include: { load: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Already processed — idempotent
    if (payment.status === "success") {
      return NextResponse.json({ status: "already_processed" });
    }

    // Verify with Paystack
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      },
    );

    const verifyData = await verifyRes.json();

    if (
      !verifyData.status ||
      verifyData.data?.status !== "success"
    ) {
      await prisma.payment.update({
        where: { reference },
        data: { status: "failed" },
      });
      return NextResponse.json(
        {
          error:
            verifyData.data?.gateway_response ??
            "Payment was not successful",
        },
        { status: 402 },
      );
    }

    // Payment confirmed — run accept logic in a transaction
    const bidId = payment.bid.id;
    const load = payment.bid.load;

    const result = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { reference },
        data: { status: "success" },
      });

      const accepted = await tx.bid.update({
        where: { id: bidId },
        data: { status: "accepted" },
      });

      // Reject all other bids on this load
      await tx.bid.updateMany({
        where: { loadId: load.id, id: { not: bidId } },
        data: { status: "rejected" },
      });

      const updatedLoad = await tx.load.update({
        where: { id: load.id },
        data: {
          acceptedDriverId: payment.bid.driverId,
          acceptedAt: new Date(),
          status: "in_transit",
        },
      });

      const shipment = await tx.shipment.create({
        data: {
          loadId: updatedLoad.id,
          shipperId: updatedLoad.shipperId,
          driverId: payment.bid.driverId,
          pickupAddress: updatedLoad.pickupAddress,
          deliveryAddress: updatedLoad.deliveryAddress,
          fareOffer: updatedLoad.fareOffer,
          status: "pending",
        },
      });

      return { accepted, load: updatedLoad, shipment };
    });

    return NextResponse.json({ status: "success", ...result });
  } catch (error) {
    console.error("[POST /api/payments/verify] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
