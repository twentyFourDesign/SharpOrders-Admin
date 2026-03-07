import { NextResponse } from "next/server";
import { verifyAdminToken, AdminTokenPayload } from "@/lib/adminJwt";

export function getAdminPayload(request: Request): AdminTokenPayload | null {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyAdminToken(auth.slice(7));
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
