import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

// POST /api/admin/admins — create a new admin (super admin only)
export async function POST(request: Request) {
  const payload = getAdminPayload(request);
  if (!payload) return unauthorized();

  const admin = await prisma.admin.findUnique({
    where: { id: payload.sub },
    select: { isSuperAdmin: true },
  });
  if (!admin?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: super admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, name } = body as { email?: string; password?: string; name?: string };

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An admin with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newAdmin = await prisma.admin.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: name?.trim() || null,
      isSuperAdmin: false,
    },
    select: { id: true, email: true, name: true, isSuperAdmin: true },
  });

  return NextResponse.json({ admin: newAdmin }, { status: 201 });
}
