import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";

import { getCurrentUser } from "@/lib/auth";
import { supabaseUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SIZE = 400; // px, square

/**
 * POST /api/avatar (multipart form, field "file")
 *
 * Checks the file, resizes it to a 400×400 WebP on the server (small and
 * fast for phones, and strips photo metadata such as GPS location), then
 * stores it in the user's own folder in Supabase Storage.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload a photo." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG or WebP photo." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is over 5 MB." }, { status: 400 });
  }

  let resized: Buffer;
  try {
    resized = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate() // respect the phone's orientation
      .resize(SIZE, SIZE, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "That file isn’t a photo we can read." }, { status: 400 });
  }

  const path = `${user.id}/avatar-${Date.now()}.webp`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from("avatars").upload(path, resized, {
    contentType: "image/webp",
    cacheControl: "31536000", // file names are unique, so cache "forever"
    upsert: false,
  });
  if (error) {
    console.error("[avatar] upload failed", error);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }

  return NextResponse.json({
    path,
    url: `${supabaseUrl}/storage/v1/object/public/avatars/${path}`,
  });
}
