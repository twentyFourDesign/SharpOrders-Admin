import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

// POST /api/shipments/[id]/rating  body: { rating: 1-5 }
export async function POST(request: Request, context: Params) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || payload.role !== "shipper") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: shipmentId } = await context.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { id: true, shipperId: true, status: true },
    });

    if (!shipment || shipment.shipperId !== payload.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (shipment.status !== "delivered") {
      return NextResponse.json(
        { error: "Can only rate delivered shipments" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { rating } = body as { rating?: number };

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    // Cast prisma to any so this continues to work even if
    // the generated Prisma types on the build server don't yet
    // include driverRating on Shipment.
    const updated = await (prisma as any).shipment.update({
      where: { id: shipmentId },
      data: { driverRating: rating },
      select: { id: true, driverRating: true },
    });

    return NextResponse.json(
      updated as { id: string; driverRating: number | null },
    );
  } catch (error) {
    console.error("[POST /api/shipments/[id]/rating] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

