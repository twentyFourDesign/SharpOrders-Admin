import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

export async function GET(request: Request) {
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

  const user = await prisma.appUser.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Read profile-level metadata from the Profile table
  const profile = await prisma.profile.findUnique({
    where: { id: payload.sub },
    select: { profilePhotoUrl: true, truckImageUrls: true },
  });

  const rawTruckImages = profile?.truckImageUrls;
  const truckImageUrlsArray: string[] = Array.isArray(rawTruckImages)
    ? (rawTruckImages as unknown as string[])
    : [];

  return NextResponse.json({
    ...user,
    profilePhotoUrl: profile?.profilePhotoUrl ?? null,
    truckImageUrls: truckImageUrlsArray,
  });
}

export async function PATCH(request: Request) {
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
  const { truckImageUrls } = body as { truckImageUrls?: string[] };

  if (truckImageUrls !== undefined) {
    if (!Array.isArray(truckImageUrls)) {
      return NextResponse.json(
        { error: "truckImageUrls must be an array" },
        { status: 400 },
      );
    }
    await prisma.profile.update({
      where: { id: payload.sub },
      data: { truckImageUrls: truckImageUrls as unknown as object },
    });
  }

  return NextResponse.json({ ok: true });
}

