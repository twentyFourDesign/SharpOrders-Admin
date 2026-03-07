import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

// GET /api/admin/payout-queue?status=pending|processing|completed|rejected&page=1&limit=20
export async function GET(request: Request) {
  if (!getAdminPayload(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "pending" | "processing" | "completed" | "rejected" | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const where = status ? { status } : {};

  const [requests, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true,
            phoneNumber: true,
            bankDetailsUpdatedAt: true,
          },
        },
      },
    }),
    prisma.withdrawalRequest.count({ where }),
  ]);

  const list = requests.map((r) => ({
    id: r.id,
    requestedAt: r.requestedAt,
    driverId: r.driverId,
    driverName:
      r.driver.displayName?.trim() ||
      [r.driver.firstName, r.driver.lastName].filter(Boolean).join(" ").trim() ||
      r.driver.email,
    driverPhone: r.driver.phoneNumber ?? null,
    driverEmail: r.driver.email,
    amountKobo: r.amount,
    amountNaira: Math.round(r.amount / 100),
    bankName: r.bankName,
    bankAccountName: r.bankAccountName,
    bankAccountNumber: r.bankAccountNumber,
    status: r.status,
    riskBankDetailsRecent: r.riskBankDetailsRecent,
    riskUnusuallyLarge: r.riskUnusuallyLarge,
    bankReferenceNumber: r.bankReferenceNumber,
    rejectionReason: r.rejectionReason,
    processedAt: r.processedAt,
  }));

  return NextResponse.json(
    { requests: list, total, page, limit },
    { headers: { "Cache-Control": "private, max-age=15" } },
  );
}
