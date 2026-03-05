import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/loads/[id]/go-live  - shipper makes a draft load visible to drivers
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

    if (!payload || payload.role !== "shipper") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loadId } = await context.params;

    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: { id: true, shipperId: true, status: true },
    });

    if (!load || load.shipperId !== payload.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (load.status !== "draft") {
      return NextResponse.json(
        { error: "Load is already live" },
        { status: 400 },
      );
    }

    const updated = await prisma.load.update({
      where: { id: loadId },
      data: { status: "available" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/loads/[id]/go-live] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
