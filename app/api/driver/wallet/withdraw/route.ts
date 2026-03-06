import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// POST /api/driver/wallet/withdraw  body: { amount: number }
export async function POST(request: Request) {
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

  const driverId = payload.sub;
  const body = await request.json();
  const amount = Number(body?.amount);

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "A valid amount is required" },
      { status: 400 },
    );
  }

  // Get or create wallet
  let wallet = await (prisma as any).wallet.findUnique({
    where: { driverId },
  });

  if (!wallet) {
    wallet = await (prisma as any).wallet.create({
      data: { driverId, balance: 0 },
    });
  }

  if (wallet.balance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 },
    );
  }

  const reference = `wdw_${driverId}_${Date.now()}`;

  // Deduct balance and record transaction
  await (prisma as any).$transaction([
    (prisma as any).wallet.update({
      where: { driverId },
      data: { balance: { decrement: amount } },
    }),
    (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "debit",
        amount,
        description: "Withdrawal",
        status: "success",
        reference,
      },
    }),
  ]);

  // Create notification so the driver sees wallet activity
  try {
    await (prisma as any).notification.create({
      data: {
        userId: driverId,
        type: "withdrawal",
        title: "Withdrawal requested",
        message: `You requested a withdrawal of ₦${amount.toLocaleString()}.`,
        data: { amount, reference },
      },
    });
  } catch (e) {
    console.error("[wallet/withdraw] failed to create notification", e);
  }

  // Fetch updated wallet
  const updated = await (prisma as any).wallet.findUnique({
    where: { driverId },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  return NextResponse.json({
    balance: updated.balance,
    transactions: updated.transactions,
    reference,
  });
}
