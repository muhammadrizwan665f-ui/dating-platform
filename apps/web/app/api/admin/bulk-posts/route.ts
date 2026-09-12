import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

/**
 * body: { text, delimiter, authorMode: "RANDOM_DEMO" | "SPECIFIC", authorUserId?, dryRun? }
 * delimiter is a literal string the admin chooses (newline, "---", "###",
 * or a custom string) — never a naive comma-split, since captions can
 * legitimately contain commas.
 */
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { text, delimiter, authorMode, authorUserId, dryRun } = body;

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const splitOn = delimiter === "NEWLINE" ? "\n" : delimiter || "---";
  const captions = text
    .split(splitOn)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  if (captions.length === 0) {
    return NextResponse.json({ error: "No posts found — check your delimiter." }, { status: 400 });
  }

  if (dryRun) {
    return NextResponse.json({ success: true, dryRun: true, count: captions.length, preview: captions.slice(0, 20) });
  }

  // Resolve the author(s) to use.
  let authorIds: string[] = [];
  if (authorMode === "SPECIFIC" && authorUserId) {
    authorIds = [authorUserId];
  } else {
    const demoUsers = await prisma.profile.findMany({ where: { isDemo: true }, select: { userId: true }, take: 200 });
    authorIds = demoUsers.map((d) => d.userId);
    if (authorIds.length === 0) {
      return NextResponse.json({ error: "No demo profiles exist yet — generate some first, or choose a specific author." }, { status: 400 });
    }
  }

  let created = 0;
  for (const caption of captions) {
    const authorId = authorIds[Math.floor(Math.random() * authorIds.length)];
    await prisma.post.create({ data: { authorId, caption, status: "VISIBLE" } });
    created++;
  }

  return NextResponse.json({ success: true, created });
}
