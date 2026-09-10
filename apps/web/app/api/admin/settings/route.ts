import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

const KNOWN_KEYS = [
  "site_name",
  "support_email",
  "support_whatsapp",
  "min_age_enforced",
  "profile_review_required",
  "auto_approve_photos",
];

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  // Always return every known key, even if never set, so the form has stable fields.
  const settings = Object.fromEntries(KNOWN_KEYS.map((k) => [k, map[k] ?? ""]));
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const entries = Object.entries(body).filter(([k]) => KNOWN_KEYS.includes(k));

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
