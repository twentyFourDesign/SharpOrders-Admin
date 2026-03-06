import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

const BUCKET = "supa";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file") ?? formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing or invalid file (use field 'file' or 'image')" },
      { status: 400 },
    );
  }

  const type = file.type || "image/jpeg";
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, WebP or GIF." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 },
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error("[upload/profile-image] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json(
      { error: "Server upload not configured" },
      { status: 500 },
    );
  }

  const ext = type.split("/")[1] || "jpg";
  const path = `profile-images/${payload.sub}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: type,
      upsert: false,
    });

  if (error) {
    console.error("[upload/profile-image] Supabase storage error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 },
    );
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  const publicUrl = urlData.publicUrl;

  // Persist on the Profile row so it survives app reloads
  try {
    await prisma.profile.update({
      where: { id: payload.sub },
      data: { profilePhotoUrl: publicUrl },
    });
  } catch (e) {
    console.error(
      "[upload/profile-image] Failed to persist profilePhotoUrl on profile",
      e,
    );
  }

  return NextResponse.json({ url: publicUrl });
}

