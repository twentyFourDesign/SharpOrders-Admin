import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// GET /api/notifications — returns user's notifications (newest first)
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

  const notifications = await (prisma as any).notification.findMany({
    where: { userId: payload.sub },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(notifications);
}

// PATCH /api/notifications — mark all as read
export async function PATCH(request: Request) {
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

  await (prisma as any).notification.updateMany({
    where: { userId: payload.sub, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
