import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// POST /api/support/tickets/[id]/reply — user adds a reply (owner only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: payload.sub },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const message = (body?.message as string)?.trim();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const reply = await prisma.supportTicketReply.create({
    data: { ticketId: id, message, isFromStaff: false },
  });
  return NextResponse.json(reply, { status: 201 });
}
