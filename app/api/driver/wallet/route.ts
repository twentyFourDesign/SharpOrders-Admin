import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// GET /api/driver/wallet — returns wallet balance, stats, and transactions
export async function GET(request: Request) {
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

  // Get or create wallet — prefer typed client when available, otherwise fall
  // back to raw SQL so this works even if @prisma/client is stale.
  const walletModel = (prisma as any).wallet as
    | {
        findUnique: (args: any) => Promise<{ id: string; balance: number; transactions: any[] } | null>;
        create: (args: any) => Promise<{ id: string; balance: number; transactions: any[] }>;
      }
    | undefined;
  let wallet: { id: string; balance: number; transactions: any[] };

  if (walletModel) {
    const found = await walletModel.findUnique({
      where: { driverId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!found) {
      wallet = await walletModel.create({
        data: { driverId, balance: 0 },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      });
    } else {
      wallet = found;
    }
  } else {
    const rows = await prisma.$queryRaw<
      { id: string; balance: number }[]
    >`SELECT id, balance FROM "wallets" WHERE "driver_id" = ${driverId} LIMIT 1`;
    let base = rows[0];
    if (!base) {
      const newId = randomUUID();
      const inserted = await prisma.$queryRaw<
        { id: string; balance: number }[]
      >`INSERT INTO "wallets" ("id", "driver_id", "balance") VALUES (${newId}, ${driverId}, 0) RETURNING id, balance`;
      base = inserted[0];
    }

    const txs = await prisma.$queryRaw<
      {
        id: string;
        type: string;
        amount: number;
        description: string | null;
        status: string;
        reference: string | null;
        created_at: Date;
      }[]
    >`SELECT id, type, amount, description, status, reference, created_at FROM "wallet_transactions" WHERE "wallet_id" = ${base.id} ORDER BY "created_at" DESC LIMIT 50`;

    wallet = {
      id: base.id,
      balance: base.balance,
      transactions: txs.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        status: t.status,
        reference: t.reference,
        createdAt: t.created_at,
      })),
    };
  }

  // Compute stats from shipments
  const shipments = await prisma.shipment.findMany({
    where: { driverId, status: "delivered" },
    select: { fareOffer: true },
  });

  const completedTrips = shipments.length;
  const totalEarned = shipments.reduce((sum: number, s: { fareOffer: number }) => sum + s.fareOffer, 0);
  const platformDeduction = Math.round(totalEarned * 0.1);
  const totalPayout = totalEarned - platformDeduction;

  return NextResponse.json({
    balance: wallet.balance,
    completedTrips,
    platformDeduction,
    totalPayout,
    transactions: wallet.transactions,
  });
}
