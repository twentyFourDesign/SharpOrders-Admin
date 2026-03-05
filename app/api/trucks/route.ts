import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const trucks = await prisma.truck.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(trucks);
}

