import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

// POST /api/admin/support/tickets/[id]/reply — admin adds a reply
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminPayload(request)) return unauthorized();

  const { id } = await params;
  const body = await request.json();
  const message = (body?.message as string)?.trim();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reply = await prisma.supportTicketReply.create({
    data: { ticketId: id, message, isFromStaff: true },
  });
  return NextResponse.json(reply, { status: 201 });
}
