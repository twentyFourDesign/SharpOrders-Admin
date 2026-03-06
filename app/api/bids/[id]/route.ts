import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/bids/[id]  body: { offerAmount?: number }
// Allows a driver to update their own pending bid.
export async function PATCH(request: Request, context: Params) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAuthToken(token);
  if (!payload || payload.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bidId } = await context.params;
  const body = await request.json();
  const { offerAmount } = body as { offerAmount?: number };

  if (offerAmount === undefined) {
    return NextResponse.json(
      { error: "offerAmount is required" },
      { status: 400 },
    );
  }

  const amount = Number(offerAmount);
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid offerAmount" }, { status: 400 });
  }

  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    select: { id: true, driverId: true, status: true },
  });

  if (!bid || bid.driverId !== payload.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (bid.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending bids can be updated" },
      { status: 400 },
    );
  }

  const updated = await prisma.bid.update({
    where: { id: bidId },
    data: { offerAmount: Math.round(amount) },
    select: { id: true, offerAmount: true, status: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/bids/[id]
// Allows a driver to cancel (delete) their own pending bid.
export async function DELETE(request: Request, context: Params) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAuthToken(token);
  if (!payload || payload.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bidId } = await context.params;

  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    select: { id: true, driverId: true, status: true },
  });

  if (!bid || bid.driverId !== payload.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (bid.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending bids can be cancelled" },
      { status: 400 },
    );
  }

  await prisma.bid.delete({ where: { id: bidId } });
  return NextResponse.json({ ok: true });
}

