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
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "Message from support";

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const appUser = await prisma.appUser.findUnique({
    where: { id },
    select: { email: true },
  });
  if (!appUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile = await prisma.profile.findUnique({
    where: { email: appUser.email },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  await prisma.notification.create({
    data: {
      userId: profile.id,
      type: "admin_message",
      title,
      message,
    },
  });

  return NextResponse.json({ ok: true });
}
