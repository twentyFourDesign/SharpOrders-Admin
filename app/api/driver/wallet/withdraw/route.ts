import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

const UNUSUALLY_LARGE_THRESHOLD_KOBO = 500_000_00; // ₦500,000
const BANK_DETAILS_RECENT_HOURS = 24;

// POST /api/driver/wallet/withdraw  body: { amount: number } (amount in naira; stored as kobo)
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAuthToken(token);
  if (!payload || payload.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const driverId = payload.sub;
  const body = await request.json().catch(() => ({}));
  const amountNaira = Number(body?.amount);
  if (!amountNaira || amountNaira <= 0) {
    return NextResponse.json({ error: "A valid amount is required" }, { status: 400 });
  }
  const amountKobo = Math.round(amountNaira * 100);

  const profile = await prisma.profile.findUnique({
    where: { id: driverId },
    select: {
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankDetailsUpdatedAt: true,
    },
  });

  if (!profile?.bankName?.trim() || !profile?.bankAccountName?.trim() || !profile?.bankAccountNumber?.trim()) {
    return NextResponse.json(
      { error: "Please add your bank details in Profile before requesting a withdrawal." },
      { status: 400 },
    );
  }

  const bankName = profile.bankName.trim();
  const bankAccountName = profile.bankAccountName.trim();
  const bankAccountNumber = profile.bankAccountNumber.trim();

  const wallet = await prisma.wallet.findUnique({
    where: { driverId },
  });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }
  // Wallet balance is stored in naira (same units as payment credits from verify).
  // amountNaira is what the user requested; compare in naira.
  if (wallet.balance < amountNaira) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const bankUpdatedAt = profile.bankDetailsUpdatedAt ?? new Date(0);
  const riskBankDetailsRecent =
    Date.now() - bankUpdatedAt.getTime() < BANK_DETAILS_RECENT_HOURS * 60 * 60 * 1000;
  const riskUnusuallyLarge = amountKobo >= UNUSUALLY_LARGE_THRESHOLD_KOBO;

  const withdrawalRequest = await prisma.$transaction(async (tx) => {
    const wr = await tx.withdrawalRequest.create({
      data: {
        driverId,
        amount: amountKobo, // WithdrawalRequest stores kobo for admin payout
        status: "pending",
        bankName,
        bankAccountName,
        bankAccountNumber,
        riskBankDetailsRecent,
        riskUnusuallyLarge,
      },
    });
    // Wallet balance is stored in naira; decrement by naira amount
    await tx.wallet.update({
      where: { driverId },
      data: { balance: { decrement: amountNaira } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "debit",
        amount: amountNaira, // Wallet/transactions store naira (same as credits)
        description: "Withdrawal (pending approval)",
        status: "pending",
        reference: `wd_${wr.id}`,
      },
    });
    return wr;
  });

  try {
    await prisma.notification.create({
      data: {
        userId: driverId,
        type: "withdrawal",
        title: "Withdrawal requested",
        message: `You requested ₦${amountNaira.toLocaleString()}. It will be processed by the admin.`,
        data: { amount: amountNaira },
      },
    });
  } catch {
    // ignore
  }

  const updated = await prisma.wallet.findUnique({
    where: { driverId },
    select: { balance: true },
  });

  return NextResponse.json({
    balance: updated?.balance ?? 0,
    message: "Withdrawal request submitted. You will be notified when it is processed.",
  });
}
