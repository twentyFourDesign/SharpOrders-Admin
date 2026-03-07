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

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        status: true,
        reference: true,
        createdAt: true,
        bid: {
          select: {
            offerAmount: true,
            driver: { select: { email: true, firstName: true, lastName: true } },
            load: {
              select: {
                loadDescription: true,
                shipper: { select: { email: true, businessName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  const shaped = payments.map((p) => ({
    ...p,
    amountNaira: Math.round(p.amount / 100),
  }));

  return NextResponse.json({ payments: shaped, total, page, limit });
}
