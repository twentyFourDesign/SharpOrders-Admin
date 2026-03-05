import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// POST /api/bids - driver applies / bids for a load
export async function POST(request: Request) {
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

  const body = await request.json();
  const { loadId, offerAmount, message } = body as {
    loadId?: string;
    offerAmount?: number;
    message?: string;
  };

  if (!loadId) {
    return NextResponse.json(
      { error: "loadId is required" },
      { status: 400 },
    );
  }

  const bid = await prisma.bid.create({
    data: {
      loadId,
      driverId: payload.sub,
      offerAmount: offerAmount ?? null,
      message: message ?? null,
    },
  });

  // Optionally mark load as applied
  await prisma.load.update({
    where: { id: loadId },
    data: { status: "applied" },
  });

  return NextResponse.json(bid);
}

