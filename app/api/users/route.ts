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
    profilePhotoUrl,
    bankName,
    bankAccountName,
    bankAccountNumber,
  } = body as {
    businessName?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    truckType?: string | null;
    licenseNumber?: string | null;
    profilePhotoUrl?: string | null;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
  };

  // Update core auth user record
  const user = await prisma.appUser.update({
    where: { id: payload.sub },
    data: {
      businessName: businessName ?? undefined,
      phone: phone ?? undefined,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      phoneNumber: phoneNumber ?? undefined,
      truckType: truckType ?? undefined,
      licenseNumber: licenseNumber ?? undefined,
    },
  });

  const profileData: Record<string, unknown> = {
    businessName: businessName ?? undefined,
    phone: phone ?? undefined,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    phoneNumber: phoneNumber ?? undefined,
    truckType: truckType ?? undefined,
    licenseNumber: licenseNumber ?? undefined,
    profilePhotoUrl: profilePhotoUrl ?? undefined,
    bankName: bankName ?? undefined,
    bankAccountName: bankAccountName ?? undefined,
    bankAccountNumber: bankAccountNumber ?? undefined,
  };
  if (bankName !== undefined || bankAccountName !== undefined || bankAccountNumber !== undefined) {
    profileData.bankDetailsUpdatedAt = new Date();
  }

  // Keep the Profile row in sync so shipment / load relations
  // can reliably read shipper/driver display details.
  try {
    await prisma.profile.update({
      where: { id: payload.sub },
      data: profileData as Parameters<typeof prisma.profile.update>[0]["data"],
    });
  } catch {
    // If the profile row is missing or schema is slightly different,
    // don't fail the whole request – the appUser update above is enough.
  }

  return NextResponse.json(user);
}

