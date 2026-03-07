import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminPayload(request)) return unauthorized();

  const { id: loadId } = await params;
  const body = await request.json().catch(() => ({}));
  const driverId = typeof body.driverId === "string" ? body.driverId.trim() : "";

  if (!driverId) {
    return NextResponse.json({ error: "driverId is required" }, { status: 400 });
  }

  const load = await prisma.load.findUnique({
    where: { id: loadId },
    select: {
      id: true,
      status: true,
      shipperId: true,
      acceptedDriverId: true,
      pickupAddress: true,
      deliveryAddress: true,
      fareOffer: true,
    },
  });
  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  if (load.status !== "available" && load.status !== "applied") {
    return NextResponse.json(
      { error: "Load can only be assigned when available or applied" },
      { status: 400 }
    );
  }

  const driver = await prisma.profile.findUnique({
    where: { id: driverId },
    select: { id: true, userType: true },
  });
  if (!driver || driver.userType !== "driver") {
    return NextResponse.json({ error: "Invalid driver" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.load.update({
      where: { id: loadId },
      data: {
        status: "accepted",
        acceptedDriverId: driverId,
        acceptedAt: new Date(),
        rejectedReason: null,
        rejectedAt: null,
      },
    }),
    prisma.bid.updateMany({
      where: { loadId },
      data: { status: "rejected" as const },
    }),
    prisma.bid.updateMany({
      where: { loadId, driverId },
      data: { status: "accepted" as const },
    }),
  ]);

  const shipment = await prisma.shipment.findFirst({
    where: { loadId },
  });
  if (!shipment) {
    await prisma.shipment.create({
      data: {
        loadId,
        driverId,
        shipperId: load.shipperId,
        pickupAddress: load.pickupAddress,
        deliveryAddress: load.deliveryAddress,
        fareOffer: load.fareOffer,
        status: "pending",
      },
    });
  }

  return NextResponse.json({ ok: true, assignedTo: driverId });
}
