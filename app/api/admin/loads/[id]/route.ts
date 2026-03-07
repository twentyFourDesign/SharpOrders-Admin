import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminPayload(request)) return unauthorized();

  const { id } = await params;

  const load = await prisma.load.findUnique({
    where: { id },
    select: {
      id: true,
      truckType: true,
      loadDescription: true,
      status: true,
      fareOffer: true,
      loadImageUrl: true,
      recipientName: true,
      recipientNumber: true,
      pickupAddress: true,
      deliveryAddress: true,
      pickupMapsUrl: true,
      deliveryMapsUrl: true,
      rejectedReason: true,
      rejectedAt: true,
      acceptedDriverId: true,
      acceptedAt: true,
      createdAt: true,
      updatedAt: true,
      shipper: {
        select: {
          id: true,
          email: true,
          businessName: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
        },
      },
      _count: { select: { bids: true } },
      bids: {
        select: {
          id: true,
          offerAmount: true,
          status: true,
          message: true,
          createdAt: true,
          driver: {
            select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...load,
    offerAmount: load.fareOffer,
  });
}
