import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

// POST /api/admin/payout-queue/bulk-reconcile — mark multiple processing requests as completed with one reference
export async function POST(request: Request) {
  const admin = getAdminPayload(request);
  if (!admin) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? (body.ids as string[]).filter((x) => typeof x === "string") : [];
  const masterReference =
    typeof body.masterReferenceNumber === "string" ? body.masterReferenceNumber.trim() : "";

  if (!masterReference) {
    return NextResponse.json(
      { error: "Master bank reference number is required" },
      { status: 400 },
    );
  }
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "At least one request id is required" },
      { status: 400 },
    );
  }

  const requests = await prisma.withdrawalRequest.findMany({
    where: { id: { in: ids }, status: "processing" },
    select: { id: true, driverId: true, amount: true },
  });

  const walletByDriver = await prisma.wallet.findMany({
    where: { driverId: { in: requests.map((r) => r.driverId) } },
    select: { id: true, driverId: true },
  });
  const walletMap = new Map(walletByDriver.map((w) => [w.driverId, w.id]));

  for (const wr of requests) {
    const walletId = walletMap.get(wr.driverId);
    if (walletId) {
      await prisma.walletTransaction.updateMany({
        where: {
          walletId,
          type: "debit",
          reference: `wd_${wr.id}`,
          status: "pending",
        },
        data: { status: "success" },
      });
    }
    await prisma.withdrawalRequest.update({
      where: { id: wr.id },
      data: {
        status: "completed",
        bankReferenceNumber: masterReference,
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
          message: `Your withdrawal of ₦${Math.round(wr.amount / 100).toLocaleString()} has been completed. Ref: ${masterReference}`,
          data: { amount: Math.round(wr.amount / 100), reference: masterReference },
        },
      });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    ok: true,
    updated: requests.length,
    status: "completed",
  });
}
