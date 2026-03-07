import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!getAdminPayload(request)) return unauthorized();

  const drivers = await prisma.profile.findMany({
    where: { userType: "driver" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      phoneNumber: true,
      businessName: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    drivers: drivers.map((d) => ({
      id: d.id,
      email: d.email,
      name: (d.displayName ?? [d.firstName, d.lastName].filter(Boolean).join(" ")) || d.email,
      phoneNumber: d.phoneNumber,
    })),
  });
}
