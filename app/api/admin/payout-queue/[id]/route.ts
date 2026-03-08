import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

// GET /api/admin/payout-queue/[id] — single request + driver context (ledger, last 5 payouts, KYC vs bank name)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminPayload(request)) return unauthorized();

  const { id } = await params;

  const req = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      driver: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          phoneNumber: true,
          bankName: true,
          bankAccountName: true,
          bankAccountNumber: true,
          bankDetailsUpdatedAt: true,
        },
      },
    },
  });
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const driverId = req.driverId;

  const [shipments, wallet, completedWithdrawals] = await Promise.all([
    prisma.shipment.findMany({
      where: { driverId, status: "delivered" },
      select: { id: true, fareOffer: true, createdAt: true, load: { select: { loadDescription: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wallet.findUnique({
      where: { driverId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
    prisma.withdrawalRequest.findMany({
      where: { driverId, status: "completed" },
      orderBy: { processedAt: "desc" },
      take: 5,
      select: {
        id: true,
        amount: true,
        processedAt: true,
        bankReferenceNumber: true,
        proofOfPaymentUrl: true,
      },
    }),
  ]);

  const totalEarned = shipments.reduce((s, sh) => s + sh.fareOffer, 0);
  const platformDeduction = Math.round(totalEarned * 0.1);
  const netEarnings = totalEarned - platformDeduction;
  const balance = wallet?.balance ?? 0;
  const driverDisplayName =
    req.driver.displayName?.trim() ||
    [req.driver.firstName, req.driver.lastName].filter(Boolean).join(" ").trim() ||
    req.driver.email;
  const kycName = driverDisplayName;
  const bankAccountName = req.bankAccountName;

  return NextResponse.json({
    request: {
      id: req.id,
      amountKobo: req.amount,
      amountNaira: Math.round(req.amount / 100),
      status: req.status,
      requestedAt: req.requestedAt,
      bankName: req.bankName,
      bankAccountName: req.bankAccountName,
      bankAccountNumber: req.bankAccountNumber,
      bankReferenceNumber: req.bankReferenceNumber,
      proofOfPaymentUrl: req.proofOfPaymentUrl ?? null,
      rejectionReason: req.rejectionReason,
      processedAt: req.processedAt,
      riskBankDetailsRecent: req.riskBankDetailsRecent,
      riskUnusuallyLarge: req.riskUnusuallyLarge,
    },
    driver: {
      id: req.driver.id,
      name: driverDisplayName,
      email: req.driver.email,
      phone: req.driver.phoneNumber,
      kycName,
      bankAccountName,
      nameMismatch: kycName.toLowerCase().trim() !== (bankAccountName ?? "").toLowerCase().trim(),
    },
    ledger: {
      completedTrips: shipments.length,
      totalEarned,
      platformDeduction,
      netEarnings,
      currentBalanceKobo: balance,
      transactions: (wallet?.transactions ?? []).slice(0, 20).map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        amountNaira: Math.round(t.amount / 100),
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
      })),
    },
    lastFivePayouts: completedWithdrawals.map((w) => ({
      id: w.id,
      amountNaira: Math.round(w.amount / 100),
      processedAt: w.processedAt,
      bankReferenceNumber: w.bankReferenceNumber,
    })),
  });
}
