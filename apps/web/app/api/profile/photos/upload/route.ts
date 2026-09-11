import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { uploadBuffer, publicUrlFor, UnsupportedFileTypeError, FileTooLargeError } from "@/lib/storage/storage";

export const dynamic = "force-dynamic";

/**
 * Server-proxied upload: browser -> this route -> R2. Replaces the older
 * presigned-URL direct-upload flow, which silently failed because the R2
 * bucket has no CORS policy allowing PUT requests from the app's origin.
 * This route needs none, since the browser never talks to R2 directly.
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { key } = await uploadBuffer(buffer, file.type, `profiles/${userId}`);
    return NextResponse.json({ key, url: publicUrlFor(key) });
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed." }, { status: 400 });
    }
    if (err instanceof FileTooLargeError) {
      return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
    }
    console.error("[photo upload] failed:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
