import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

// POST /api/admin/payout-queue/[id]/mark-paid — set status to completed with bank reference (required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = getAdminPayload(request);
  if (!admin) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const bankReferenceNumber = typeof body.bankReferenceNumber === "string" ? body.bankReferenceNumber.trim() : "";
  const proofOfPaymentUrl = typeof body.proofOfPaymentUrl === "string" ? body.proofOfPaymentUrl.trim() : null;
  const internalNotes = typeof body.internalNotes === "string" ? body.internalNotes.trim() : null;

  if (!bankReferenceNumber) {
    return NextResponse.json(
      { error: "Bank reference number / session ID is required" },
      { status: 400 },
    );
  }

  const wr = await prisma.withdrawalRequest.findUnique({
    where: { id },
    select: { id: true, status: true, driverId: true, amount: true },
  });
  if (!wr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wr.status !== "pending" && wr.status !== "processing") {
    return NextResponse.json(
      { error: "Request is not in a state that can be marked as paid" },
      { status: 400 },
    );
  }

  const wallet = await prisma.wallet.findUnique({
    where: { driverId: wr.driverId },
    select: { id: true },
  });
  if (wallet) {
    await prisma.walletTransaction.updateMany({
      where: {
        walletId: wallet.id,
        type: "debit",
        reference: `wd_${id}`,
        status: "pending",
      },
      data: { status: "success" },
    });
  }

  await prisma.withdrawalRequest.update({
    where: { id },
    data: {
      status: "completed",
      bankReferenceNumber,
      proofOfPaymentUrl: proofOfPaymentUrl ?? undefined,
      internalNotes: internalNotes ?? undefined,
      processedAt: new Date(),
      processedByAdminId: admin.sub,
    },
  });

  try {
    await prisma.notification.create({
      data: {
        userId: wr.driverId,
        type: "withdrawal",
        title: "Withdrawal completed",
        message: `Your withdrawal of ₦${Math.round(wr.amount / 100).toLocaleString()} has been completed. Ref: ${bankReferenceNumber}`,
        data: { amount: Math.round(wr.amount / 100), reference: bankReferenceNumber },
      },
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, status: "completed" });
}
