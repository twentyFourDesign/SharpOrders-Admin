import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/jwt";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, code } = body as { email?: string; code?: string };

  if (!email || !code) {
    return NextResponse.json(
      { error: "email and code are required" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase();

  const otp = await prisma.otp.findFirst({
    where: {
      email: normalizedEmail,
      code,
      purpose: "signup",
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 },
    );
  }

  const user = await prisma.appUser.update({
    where: { email: normalizedEmail },
    data: { emailVerified: true },
    select: { id: true, email: true, role: true, isBlacklisted: true, suspendedUntil: true },
  });

  if (user.isBlacklisted) {
    return NextResponse.json(
      { error: "Your account has been blacklisted. Please contact support." },
      { status: 403 },
    );
  }

  if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
    return NextResponse.json(
      {
        error: `Your account is suspended until ${new Date(user.suspendedUntil).toLocaleString()}. Please contact support.`,
      },
      { status: 403 },
    );
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  const token = signAuthToken({
    sub: user.id as string,
    email: user.email,
    role: user.role as "shipper" | "driver",
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}

