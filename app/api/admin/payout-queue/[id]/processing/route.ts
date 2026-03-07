import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

// PATCH /api/admin/payout-queue/[id]/processing — set status to processing (e.g. exported for bank)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminPayload(request)) return unauthorized();

  const { id } = await params;

  const wr = await prisma.withdrawalRequest.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!wr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wr.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending requests can be set to processing" },
      { status: 400 },
    );
  }

  await prisma.withdrawalRequest.update({
    where: { id },
    data: { status: "processing" },
  });

  return NextResponse.json({ ok: true, status: "processing" });
}
