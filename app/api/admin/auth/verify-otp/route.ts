import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAdminToken } from "@/lib/adminJwt";

export async function POST(request: Request) {
  const { email, code } = (await request.json()) as { email?: string; code?: string };

  if (!email || !code) {
    return NextResponse.json({ error: "email and code are required" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (!admin) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const otp = await prisma.adminOtp.findFirst({
    where: {
      adminId: admin.id,
      code,
      purpose: "login",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  // Mark OTP consumed
  await prisma.adminOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  const token = signAdminToken({ sub: admin.id, email: admin.email });

  return NextResponse.json({
    status: "ok",
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, isSuperAdmin: admin.isSuperAdmin },
  });
}
