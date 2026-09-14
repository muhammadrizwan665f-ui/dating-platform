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

  async function uploadOne(file: File): Promise<{ name: string; url?: string; error?: string }> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { key } = await uploadBuffer(buffer, file.type, "demo-profiles");
      return { name: file.name, url: publicUrlFor(key) };
    } catch (err) {
      const message =
        err instanceof UnsupportedFileTypeError ? "Unsupported file type" :
        err instanceof FileTooLargeError ? "File too large (max 8MB)" :
        "Upload failed";
      return { name: file.name, error: message };
    }
  }

  // Uploaded in parallel chunks (was one-at-a-time before, which could take
  // 50-100+ seconds for 50 files and risk a request timeout).
  const CONCURRENCY = 10;
  const results: { name: string; url?: string; error?: string }[] = [];
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map(uploadOne));
    results.push(...chunkResults);
  }

  return NextResponse.json({
    success: true,
    uploaded: results.filter((r) => r.url).length,
    failed: results.filter((r) => r.error).length,
    results,
  });
}
