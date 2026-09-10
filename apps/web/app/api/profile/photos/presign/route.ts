import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { getUploadUrl, UnsupportedFileTypeError, FileTooLargeError } from "@/lib/storage/storage";

const schema = z.object({ contentType: z.string(), sizeBytes: z.number().int().positive() });

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const { uploadUrl, key } = await getUploadUrl(parsed.data.contentType, parsed.data.sizeBytes, `profiles/${userId}`);
    return NextResponse.json({ uploadUrl, key });
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed." }, { status: 400 });
    }
    if (err instanceof FileTooLargeError) {
      return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
    }
    throw err;
  }
}
