import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/jwt";
import { sendOtpEmail } from "@/lib/email";

const OTP_EXP_MINUTES = 10;

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase();

  const user = await prisma.appUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  if (!user.emailVerified) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

    await prisma.otp.create({
      data: {
        email: normalizedEmail,
        code,
        purpose: "login",
        expiresAt,
      },
    });

    await sendOtpEmail({ to: normalizedEmail, code });

    return NextResponse.json({
      status: "otp_required",
    });
  }

  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({
    status: "ok",
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profilePhotoUrl: user.profilePhotoUrl ?? null,
    },
  });
}

