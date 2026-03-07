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

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true, businessName: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

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
