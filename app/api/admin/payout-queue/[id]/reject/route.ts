import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

const REJECTION_REASONS = [
  "Invalid bank details",
  "Suspected fraud",
  "System error",
  "Duplicate request",
  "Other",
];

// POST /api/admin/payout-queue/[id]/reject — set status to rejected, refund driver, notify
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = getAdminPayload(request);
  if (!admin) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!reason || !REJECTION_REASONS.includes(reason)) {
    return NextResponse.json(
      { error: "A valid reason is required", reasons: REJECTION_REASONS },
      { status: 400 },
    );
  }

  const wr = await prisma.withdrawalRequest.findUnique({
    where: { id },
    select: { id: true, status: true, driverId: true, amount: true },
  });
  if (!wr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wr.status === "completed" || wr.status === "rejected") {
    return NextResponse.json(
      { error: "Request cannot be rejected in current state" },
      { status: 400 },
    );
  }

  const wallet = await prisma.wallet.findUnique({
    where: { driverId: wr.driverId },
  });
  if (!wallet) {
    return NextResponse.json({ error: "Driver wallet not found" }, { status: 500 });
  }

  // WithdrawalRequest.amount is in kobo; wallet balance is in naira (payment verify credits naira)
  const refundNaira = Math.round(wr.amount / 100);
  await prisma.$transaction([
    prisma.wallet.update({
      where: { driverId: wr.driverId },
      data: { balance: { increment: refundNaira } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "credit",
        amount: refundNaira,
        description: `Withdrawal rejected - refund (${reason})`,
        status: "success",
        reference: `refund_${id}_${Date.now()}`,
      },
    }),
    prisma.walletTransaction.updateMany({
      where: {
        walletId: wallet.id,
        type: "debit",
        reference: `wd_${id}`,
        status: "pending",
      },
      data: { status: "failed" },
    }),
    prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: "rejected",
        rejectionReason: reason,
        processedAt: new Date(),
        processedByAdminId: admin.sub,
      },
    }),
  ]);

  try {
    await prisma.notification.create({
      data: {
        userId: wr.driverId,
        type: "withdrawal",
        title: "Withdrawal rejected",
        message: `Your withdrawal of ₦${Math.round(wr.amount / 100).toLocaleString()} was rejected. Reason: ${reason}. The amount has been refunded to your wallet.`,
        data: { amount: Math.round(wr.amount / 100), reason },
      },
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, status: "rejected" });
}
