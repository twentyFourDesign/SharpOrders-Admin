import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminPayload(request)) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "Rejected by admin";

  const load = await prisma.load.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  if (load.status === "delivered" || load.status === "cancelled") {
    return NextResponse.json(
      { error: "Load cannot be rejected in current status" },
      { status: 400 }
    );
  }

  await prisma.load.update({
    where: { id },
    data: {
      status: "cancelled",
      rejectedReason: reason || "Rejected by admin",
      rejectedAt: new Date(),
      acceptedDriverId: null,
      acceptedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
