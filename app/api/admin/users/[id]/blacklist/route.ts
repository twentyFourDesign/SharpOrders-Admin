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
  const blacklist = Boolean(body.blacklist);

  await prisma.appUser.update({
    where: { id },
    data: { isBlacklisted: blacklist, suspendedUntil: blacklist ? null : undefined },
  });

  return NextResponse.json({ ok: true, isBlacklisted: blacklist });
}
