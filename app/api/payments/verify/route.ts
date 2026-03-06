import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

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

    // Credit driver's wallet and create notifications (non-blocking, best effort)
    try {
      const driverId = payment.bid.driverId;
      const fareAmount = payment.bid.offerAmount ?? load.fareOffer;
      const route = `${load.pickupAddress} → ${load.deliveryAddress}`;

      const creditRef = `pay_${payment.reference}`;

      // Prefer typed Prisma client if the Wallet model exists, otherwise fall back
      // to raw SQL so this still works even if @prisma/client is stale.
      const walletModel = (prisma as any).wallet;
      const txModel = (prisma as any).walletTransaction;

      if (walletModel && txModel) {
        // Typed path (when Prisma client knows about Wallet)
        let wallet = await walletModel.findUnique({ where: { driverId } });
        if (!wallet) {
          wallet = await walletModel.create({ data: { driverId, balance: 0 } });
        }

        const existingTx = await txModel.findUnique({
          where: { reference: creditRef },
        });
        if (!existingTx) {
          await walletModel.update({
            where: { driverId },
            data: { balance: { increment: fareAmount } },
          });
          await txModel.create({
            data: {
              walletId: wallet.id,
              type: "credit",
              amount: fareAmount,
              description: `Payment for ${route}`,
              status: "success",
              reference: creditRef,
            },
          });
        }
      } else {
        // Fallback raw SQL path (when Wallet model property is missing)
        const walletRows = await prisma.$queryRaw<
          { id: string; balance: number }[]
        >`SELECT id, balance FROM "wallets" WHERE "driver_id" = ${driverId} LIMIT 1`;
        let wallet = walletRows[0];
        if (!wallet) {
          const newId = randomUUID();
          const inserted = await prisma.$queryRaw<
            { id: string; balance: number }[]
          >`INSERT INTO "wallets" ("id", "driver_id", "balance") VALUES (${newId}, ${driverId}, 0) RETURNING id, balance`;
          wallet = inserted[0];
        }

        const existingTxRows = await prisma.$queryRaw<
          { reference: string }[]
        >`SELECT reference FROM "wallet_transactions" WHERE reference = ${creditRef} LIMIT 1`;
        if (existingTxRows.length === 0) {
          await prisma.$executeRaw`
            UPDATE "wallets"
            SET "balance" = "balance" + ${fareAmount}
            WHERE "driver_id" = ${driverId}
          `;

          const txId = randomUUID();
          await prisma.$executeRaw`
            INSERT INTO "wallet_transactions" ("id", "wallet_id", "type", "amount", "description", "status", "reference")
            VALUES (${txId}, ${wallet.id}, 'credit', ${fareAmount}, ${`Payment for ${route}`}, 'success', ${creditRef})
          `;
        }
      }

      // Notify driver: payment received
      await (prisma as any).notification.create({
        data: {
          userId: driverId,
          type: "new_payment",
          title: "New Payment",
          message: `New payment of ₦${fareAmount.toLocaleString()} has been received for ${route}`,
          data: { shipmentId: result.shipment.id, amount: fareAmount },
        },
      });

      // Notify driver: bid accepted
      await (prisma as any).notification.create({
        data: {
          userId: driverId,
          type: "bid_accepted",
          title: "Bid Accepted",
          message: `Your bid for ${route} has been accepted for ₦${fareAmount.toLocaleString()}`,
          data: { shipmentId: result.shipment.id, loadId: load.id },
        },
      });
    } catch (notifErr) {
      console.error("[payments/verify] wallet/notification update failed", notifErr);
    }

    return NextResponse.json({ status: "success", ...result });
  } catch (error) {
    console.error("[POST /api/payments/verify] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
