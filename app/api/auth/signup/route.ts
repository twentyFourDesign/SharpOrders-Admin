import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";

const OTP_EXP_MINUTES = 10;

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, role } = body as {
    email?: string;
    password?: string;
    role?: "shipper" | "driver";
  };

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: "email, password and role are required" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.appUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 409 },
    );
  }

  const user = await prisma.appUser.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role,
    },
  });

  // Ensure a matching Profile row exists for foreign keys (loads.shipper_id, etc.)
  await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: normalizedEmail,
      userType: role === "shipper" ? "shipper" : "driver",
    },
    update: {},
  });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

  await prisma.otp.create({
    data: {
      email: normalizedEmail,
      code,
      purpose: "signup",
      expiresAt,
    },
  });

  await sendOtpEmail({ to: normalizedEmail, code });

  return NextResponse.json({ ok: true });
}

