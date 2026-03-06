import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

// GET /api/driver/loads/[id] - single load details for driver (for apply/bid screen)
export async function GET(request: Request, context: Params) {
  try {
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

    const { id: loadId } = await context.params;
    const driverId = payload.sub;

    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        OR: [
          { status: "available" },
          { bids: { some: { driverId } } },
        ],
      },
      include: {
        bids: {
          where: { driverId },
          select: { id: true, status: true, offerAmount: true },
        },
      },
    });

    if (!load) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const myBid = load.bids[0] ?? null;
    const result = {
      id: load.id,
      pickupAddress: load.pickupAddress,
      deliveryAddress: load.deliveryAddress,
      truckType: load.truckType,
      loadDescription: load.loadDescription,
      fareOffer: load.fareOffer,
      loadStatus: load.status,
      loadImageUrl: load.loadImageUrl ?? null,
      appliedByMe: !!myBid,
      myBidStatus: myBid?.status ?? null,
      myBidId: myBid?.id ?? null,
      myBidOfferAmount: myBid?.offerAmount ?? null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/driver/loads/[id]] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
