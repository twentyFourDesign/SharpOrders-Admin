import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// GET /api/driver/loads
// Returns all available loads + any load the driver has bid on (so they can see the outcome)
export async function GET(request: Request) {
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

    const driverId = payload.sub;

    const loads = await prisma.load.findMany({
      where: {
        OR: [
          // All live loads
          { status: "available" },
          // Loads this driver has bid on (to show outcome: accepted/rejected)
          { bids: { some: { driverId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        bids: {
          where: { driverId },
          select: { id: true, status: true },
        },
      },
    });

    const shaped = loads.map((load) => {
      const myBid = load.bids[0] ?? null;
      return {
        id: load.id,
        pickupAddress: load.pickupAddress,
        deliveryAddress: load.deliveryAddress,
        truckType: load.truckType,
        loadDescription: load.loadDescription,
        fareOffer: load.fareOffer,
        loadStatus: load.status,
        appliedByMe: !!myBid,
        myBidStatus: myBid?.status ?? null, // null | 'pending' | 'accepted' | 'rejected'
      };
    });

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("[GET /api/driver/loads] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
