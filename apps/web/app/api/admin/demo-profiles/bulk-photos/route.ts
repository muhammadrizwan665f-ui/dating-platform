import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";
import { uploadBuffer, publicUrlFor, UnsupportedFileTypeError, FileTooLargeError } from "@/lib/storage/storage";

export const dynamic = "force-dynamic";

/** Uploads multiple photo files at once (multipart form, field name "files"). */
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (files.length === 0) return NextResponse.json({ error: "No files provided" }, { status: 400 });

  const results: { name: string; url?: string; error?: string }[] = [];
  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { key } = await uploadBuffer(buffer, file.type, "demo-profiles");
      results.push({ name: file.name, url: publicUrlFor(key) });
    } catch (err) {
      const message =
        err instanceof UnsupportedFileTypeError ? "Unsupported file type" :
        err instanceof FileTooLargeError ? "File too large (max 8MB)" :
        "Upload failed";
      results.push({ name: file.name, error: message });
    }
  }

  return NextResponse.json({
    success: true,
    uploaded: results.filter((r) => r.url).length,
    failed: results.filter((r) => r.error).length,
    results,
  });
}
