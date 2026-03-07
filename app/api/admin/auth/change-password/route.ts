import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const payload = getAdminPayload(request);
  if (!payload) return unauthorized();

  const { currentPassword, newPassword } = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "currentPassword and newPassword are required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } });

  return NextResponse.json({ status: "ok" });
}
