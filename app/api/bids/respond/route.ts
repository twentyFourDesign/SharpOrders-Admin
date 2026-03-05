import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// POST /api/bids/respond  body: { bidId, action: 'accept' | 'reject' }
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAuthToken(token);

  if (!payload || payload.role !== "shipper") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bidId, action } = body as {
    bidId?: string;
    action?: "accept" | "reject";
  };

  if (!bidId || !action) {
    return NextResponse.json(
      { error: "bidId and action are required" },
      { status: 400 },
    );
  }

  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { load: true },
  });

  if (!bid || !bid.load || bid.load.shipperId !== payload.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ---- REJECT ----
  if (action === "reject") {
    const updated = await prisma.bid.update({
      where: { id: bidId },
      data: { status: "rejected" },
    });
    return NextResponse.json(updated);
  }

  // ---- ACCEPT: initialise Paystack payment first ----
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) {
    return NextResponse.json(
      { error: "Paystack not configured" },
      { status: 500 },
    );
  }

  const amountKobo = (bid.offerAmount ?? bid.load.fareOffer) * 100;
  const reference = `so_${bidId}_${Date.now()}`;

  const paystackRes = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payload.email,
        amount: amountKobo,
        reference,
        metadata: {
          bidId,
          shipperId: payload.sub,
        },
      }),
    },
  );

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    console.error("[bids/respond] Paystack init failed", paystackData);
    return NextResponse.json(
      { error: paystackData.message ?? "Payment init failed" },
      { status: 500 },
    );
  }

  // Persist the pending payment so we can verify it later
  await prisma.payment.upsert({
    where: { bidId },
    create: {
      bidId,
      reference,
      amount: amountKobo,
      email: payload.email,
      status: "pending",
    },
    update: {
      reference,
      amount: amountKobo,
      status: "pending",
    },
  });

  return NextResponse.json({
    status: "payment_required",
    authorizationUrl: paystackData.data.authorization_url,
    reference,
  });
}
