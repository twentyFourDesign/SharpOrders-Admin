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

  const [rawShipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: {
        id: true,
        status: true,
        fareOffer: true,
        createdAt: true,
        shipper: { select: { email: true, businessName: true, firstName: true, lastName: true } },
        driver: { select: { email: true, firstName: true, lastName: true } },
        load: {
          select: {
            loadDescription: true,
            truckType: true,
            pickupAddress: true,
            deliveryAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  const shipments = rawShipments.map((s) => ({
    ...s,
    load: s.load
      ? {
          ...s.load,
          pickupCity: s.load.pickupAddress,
          deliveryCity: s.load.deliveryAddress,
          pickupState: null,
          deliveryState: null,
        }
      : null,
  }));

  return NextResponse.json({ shipments, total, page, limit });
}
