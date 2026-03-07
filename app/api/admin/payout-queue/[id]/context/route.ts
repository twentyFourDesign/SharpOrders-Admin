import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

// GET /api/admin/payout-queue/[id]/context — ledger breakdown, last 5 payouts, KYC vs bank name
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminPayload(request)) return unauthorized();
  const { id } = await params;

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          bankAccountName: true,
          wallet: { select: { id: true } },
        },
      },
    },
  });
  if (!withdrawal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const driverId = withdrawal.driverId;
  const walletId = withdrawal.driver?.wallet?.id;
  const kycName =
    withdrawal.driver?.displayName?.trim() ||
    [withdrawal.driver?.firstName, withdrawal.driver?.lastName].filter(Boolean).join(" ").trim() ||
    null;

  const [shipments, lastCompletedPayouts, walletCredits] = await Promise.all([
    prisma.shipment.findMany({
      where: { driverId, status: "delivered" },
      select: { id: true, fareOffer: true, createdAt: true, load: { select: { loadDescription: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawalRequest.findMany({
      where: { driverId, status: "completed" },
      select: { id: true, amount: true, requestedAt: true, processedAt: true },
      orderBy: { processedAt: "desc" },
      take: 5,
    }),
    walletId
      ? prisma.walletTransaction.findMany({
          where: { walletId, type: "credit", status: "success" },
          select: { amount: true, description: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [],
  ]);

  const totalEarned = shipments.reduce((s, sh) => s + sh.fareOffer, 0);
  const platformRate = 0.1;
  const platformDeduction = Math.round(totalEarned * platformRate);
  const netEarnings = totalEarned - platformDeduction;

  const ledgerRows = shipments.map((s) => ({
    type: "trip",
    description: s.load?.loadDescription ?? "Trip",
    amountNaira: Math.round(s.fareOffer / 100),
    date: s.createdAt,
  }));
  ledgerRows.push({
    type: "adjustment",
    description: "Platform commission (10%)",
    amountNaira: -Math.round(platformDeduction / 100),
    date: null,
  });

  return NextResponse.json({
    withdrawalId: id,
    amountRequestedNaira: Math.round(withdrawal.amount / 100),
    kycName,
    bankAccountName: withdrawal.bankAccountName,
    nameMismatch: kycName !== null && withdrawal.bankAccountName.trim() !== kycName.trim(),
    ledger: {
      rows: ledgerRows,
      totalEarnedNaira: Math.round(totalEarned / 100),
      platformDeductionNaira: Math.round(platformDeduction / 100),
      netEarningsNaira: Math.round(netEarnings / 100),
    },
    walletCredits: walletCredits.map((t) => ({
      amountNaira: Math.round(t.amount / 100),
      description: t.description,
      date: t.createdAt,
    })),
    lastCompletedPayouts: lastCompletedPayouts.map((p) => ({
      id: p.id,
      amountNaira: Math.round(p.amount / 100),
      requestedAt: p.requestedAt,
      processedAt: p.processedAt,
    })),
  });
}
