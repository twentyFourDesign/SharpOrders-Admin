import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

const DRIVER_STATUS_ORDER = [
  "pending",
  "picked_up",
  "in_transit",
  "approaching_dropoff",
  "delivered",
] as const;

// PATCH /api/shipments/[id]/update  body: { status?, currentLocation? }
export async function PATCH(request: Request, context: Params) {
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

    const { id: shipmentId } = await context.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { id: true, driverId: true, status: true },
    });

    if (!shipment || shipment.driverId !== payload.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, currentLocation } = body as {
      status?: string;
      currentLocation?: string;
    };

    if (
      status &&
      !DRIVER_STATUS_ORDER.includes(status as (typeof DRIVER_STATUS_ORDER)[number])
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        ...(status ? { status: status as any } : {}),
        ...(currentLocation !== undefined ? { currentLocation } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/shipments/[id]/update] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
