import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// GET /api/loads - list loads for current shipper
export async function GET(request: Request) {
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

  const loads = await prisma.load.findMany({
    where: { shipperId: payload.sub },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(loads);
}

// POST /api/loads - create a new load for current shipper
export async function POST(request: Request) {
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

  const body = await request.json();
  const {
    pickupAddress,
    deliveryAddress,
    truckType,
    loadDescription,
    recipientName,
    recipientNumber,
    fareOffer,
    pickupMapsUrl,
    deliveryMapsUrl,
  } = body as {
    pickupAddress?: string;
    deliveryAddress?: string;
    truckType?: string;
    loadDescription?: string;
    recipientName?: string;
    recipientNumber?: string;
    fareOffer?: number;
    pickupMapsUrl?: string | null;
    deliveryMapsUrl?: string | null;
  };

  if (
    !pickupAddress ||
    !deliveryAddress ||
    !truckType ||
    !loadDescription ||
    !fareOffer
  ) {
    return NextResponse.json(
      { error: "Missing required load fields" },
      { status: 400 },
    );
  }

  const load = await prisma.load.create({
    data: {
      shipperId: payload.sub,
      pickupAddress,
      deliveryAddress,
      pickupMapsUrl: pickupMapsUrl ?? null,
      deliveryMapsUrl: deliveryMapsUrl ?? null,
      truckType,
      loadDescription,
      recipientName: recipientName ?? null,
      recipientNumber: recipientNumber ?? null,
      fareOffer,
      status: "available",
    },
  });

  return NextResponse.json(load);
}

