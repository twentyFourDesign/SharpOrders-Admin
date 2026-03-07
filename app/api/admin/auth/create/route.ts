/**
 * One-time-use endpoint to bootstrap the first admin account.
 * Requires ADMIN_BOOTSTRAP_SECRET in env to prevent public access.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 403 });
  }

  const { bootstrapSecret, email, password, name } = (await request.json()) as {
    bootstrapSecret?: string;
    email?: string;
    password?: string;
    name?: string;
  };

  if (bootstrapSecret !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Admin already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: { email: email.toLowerCase(), passwordHash, name, isSuperAdmin: true },
    select: { id: true, email: true, name: true, isSuperAdmin: true },
  });

  return NextResponse.json({ admin });
}
