import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

const BUCKET = "supa";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export async function POST(request: Request) {
  const admin = getAdminPayload(request);
  if (!admin) return unauthorized();

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

  const type = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, WebP, GIF or PDF." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 },
    );
  }

  if (!supabaseAdmin?.storage) {
    return NextResponse.json(
      { error: "Server upload not configured" },
      { status: 500 },
    );
  }

  const ext = type === "application/pdf" ? "pdf" : (type.split("/")[1] || "jpg");
  const path = `proof-of-payment/${admin.sub}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: type,
      upsert: false,
    });

  if (error) {
    console.error("[admin/upload/proof-of-payment]", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 },
    );
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
  return NextResponse.json({ url: urlData.publicUrl });
}
