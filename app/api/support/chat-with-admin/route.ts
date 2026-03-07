import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

const CHAT_WITH_ADMIN_TITLE = "Chat with Admin";

// GET /api/support/chat-with-admin — get or create the "Chat with Admin" ticket for current user
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use Profile.id so the same ticket is used by admin (admin finds by profile.id)
  const profile = await prisma.profile.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const existing = await prisma.supportTicket.findFirst({
    where: {
      userId: profile.id,
      title: CHAT_WITH_ADMIN_TITLE,
      status: { in: ["open", "in_progress"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: profile.id,
      title: CHAT_WITH_ADMIN_TITLE,
      description: "Direct chat with support.",
      status: "open",
    },
  });

  return NextResponse.json(ticket);
}
