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
  const durationHours = typeof body.durationHours === "number" ? body.durationHours : null;
  const until = body.until ? new Date(body.until) : null;

  let suspendedUntil: Date | null = null;
  if (durationHours != null && durationHours > 0) {
    suspendedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  } else if (until && until.getTime() > Date.now()) {
    suspendedUntil = until;
  }

  await prisma.appUser.update({
    where: { id },
    data: { suspendedUntil },
  });

  return NextResponse.json({ ok: true, suspendedUntil: suspendedUntil?.toISOString() ?? null });
}
