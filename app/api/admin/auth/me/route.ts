import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/adminJwt";
import { prisma } from "@/lib/prisma";

function getToken(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function GET(request: Request) {
  const token = getToken(request);
  const payload = token ? verifyAdminToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.admin.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, isSuperAdmin: true, createdAt: true },
  });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ admin });
}
