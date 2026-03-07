import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAdminToken } from "@/lib/adminJwt";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });

  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signAdminToken({ sub: admin.id, email: admin.email });

  return NextResponse.json({
    status: "ok",
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, isSuperAdmin: admin.isSuperAdmin },
  });
}
