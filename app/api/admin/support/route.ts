import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!getAdminPayload(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [ticketsRaw, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true, userType: true, businessName: true, firstName: true, lastName: true, displayName: true, phone: true, phoneNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  const ticketIds = ticketsRaw.map((t) => t.id);
  const repliesByTicket =
    ticketIds.length > 0
      ? await prisma.supportTicketReply.findMany({
          where: { ticketId: { in: ticketIds } },
          select: { ticketId: true, id: true, message: true, isFromStaff: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const replyMap = new Map<string, typeof repliesByTicket>();
  for (const r of repliesByTicket) {
    const list = replyMap.get(r.ticketId) ?? [];
    list.push(r);
    replyMap.set(r.ticketId, list);
  }

  const tickets = ticketsRaw.map((t) => ({
    ...t,
    replies: replyMap.get(t.id) ?? [],
  }));

  return NextResponse.json({ tickets, total, page, limit });
}

export async function PATCH(request: Request) {
  if (!getAdminPayload(request)) return unauthorized();

  const { id, status } = (await request.json()) as { id?: string; status?: string };
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status: status as "open" | "in_progress" | "resolved" | "closed" },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ticket });
}
