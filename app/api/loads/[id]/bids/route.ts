import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

// GET /api/loads/[id]/bids - list bids for a specific load (shipper only)
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

    if (!payload || payload.role !== "shipper") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loadId } = await context.params;

    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { id: true, shipperId: true },
    });

    if (!load || load.shipperId !== payload.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const bids = await prisma.bid.findMany({
      where: { loadId },
      orderBy: { createdAt: "asc" },
      include: {
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            truckType: true,
          },
        },
      },
    });

    return NextResponse.json(bids);
  } catch (error) {
    console.error("[GET /api/loads/[id]/bids] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
