import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

/** body: { assignments: [{ profileId, photoUrl }] } — replaces each profile's primary photo. */
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { assignments } = await req.json();
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return NextResponse.json({ error: "assignments array is required" }, { status: 400 });
  }

  let updated = 0;
  for (const a of assignments) {
    if (!a.profileId || !a.photoUrl) continue;
    // Demo-only safety: never let this bulk tool touch a real user's photos.
    const profile = await prisma.profile.findUnique({ where: { id: a.profileId }, select: { isDemo: true } });
    if (!profile?.isDemo) continue;

    await prisma.profilePhoto.deleteMany({ where: { profileId: a.profileId, isPrimary: true } });
    await prisma.profilePhoto.create({
      data: { profileId: a.profileId, url: a.photoUrl, position: 0, isPrimary: true, moderationStatus: "APPROVED" },
    });
    updated++;
  }

  return NextResponse.json({ success: true, updated });
}
