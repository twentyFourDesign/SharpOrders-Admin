import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// GET /api/driver/loads - list loads available for the current driver
export async function GET(request: Request) {
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

  const user = await prisma.appUser.findUnique({
    where: { id: payload.sub },
  });

  const truckType = user?.truckType ?? undefined;

  const loads = await prisma.load.findMany({
    where: {
      status: "available",
      ...(truckType ? { truckType } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(loads);
}

