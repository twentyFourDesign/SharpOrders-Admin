import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    businessName,
    phone,
    firstName,
    lastName,
    phoneNumber,
    truckType,
    licenseNumber,
  } = body as {
    businessName?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    truckType?: string;
    licenseNumber?: string;
  };

  const user = await prisma.appUser.update({
    where: { id: payload.sub },
    data: {
      businessName,
      phone,
      firstName,
      lastName,
      phoneNumber,
      truckType,
      licenseNumber,
    },
  });

  return NextResponse.json(user);
}

