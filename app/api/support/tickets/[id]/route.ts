import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// GET /api/support/tickets/[id] — get one ticket with replies (owner only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      replies: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Allow access if ticket belongs to this user (by JWT sub = AppUser.id) or by their Profile.id
  const isOwnerBySub = ticket.userId === payload.sub;
  let isOwnerByProfile = false;
  if (!isOwnerBySub && payload.email) {
    const profile = await prisma.profile.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });
    isOwnerByProfile = profile?.id === ticket.userId;
  }
  if (!isOwnerBySub && !isOwnerByProfile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...ticket,
    replies: ticket.replies ?? [],
  });
}
