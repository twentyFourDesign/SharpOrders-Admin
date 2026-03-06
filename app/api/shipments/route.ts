import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// GET /api/shipments  - returns shipments for current user (shipper or driver)
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
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where =
      payload.role === "shipper"
        ? { shipperId: payload.sub }
        : { driverId: payload.sub };

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        load: {
          select: {
            truckType: true,
            loadDescription: true,
            recipientName: true,
            recipientNumber: true,
            loadImageUrl: true,
            pickupMapsUrl: true,
            deliveryMapsUrl: true,
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
            truckType: true,
          },
        },
        shipper: {
          select: {
            businessName: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(shipments);
  } catch (error) {
    console.error("[GET /api/shipments] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
