import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!getAdminPayload(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [bids, total] = await Promise.all([
    prisma.bid.findMany({
      where,
      select: {
        id: true,
        offerAmount: true,
        status: true,
        createdAt: true,
        load: {
          select: {
            id: true,
            loadDescription: true,
            truckType: true,
            shipper: { select: { email: true, businessName: true } },
          },
        },
        driver: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bid.count({ where }),
  ]);

  return NextResponse.json(
    { bids, total, page, limit },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
  );
}
