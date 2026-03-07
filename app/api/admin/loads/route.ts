import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!getAdminPayload(request)) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim() ?? "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { loadDescription: { contains: search, mode: "insensitive" } },
        { recipientName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [loads, total] = await Promise.all([
      prisma.load.findMany({
        where,
        select: {
          id: true,
          truckType: true,
          loadDescription: true,
          status: true,
          fareOffer: true,
          loadImageUrl: true,
          recipientName: true,
          recipientNumber: true,
          pickupAddress: true,
          deliveryAddress: true,
          pickupMapsUrl: true,
          deliveryMapsUrl: true,
          rejectedReason: true,
          rejectedAt: true,
          acceptedDriverId: true,
          acceptedAt: true,
          createdAt: true,
          shipper: { select: { id: true, email: true, businessName: true, firstName: true, lastName: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.load.count({ where }),
    ]);

    return NextResponse.json(
      {
        loads: loads.map((l) => ({
          ...l,
          offerAmount: l.fareOffer,
          pickupCity: l.pickupAddress,
          deliveryCity: l.deliveryAddress,
          pickupState: null,
          deliveryState: null,
        })),
        total,
        page,
        limit,
      },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch loads" },
      { status: 500 },
    );
  }
}
