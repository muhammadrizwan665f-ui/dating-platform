import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const themes = await prisma.theme.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ themes });
}

/**
 * PATCH body shapes:
 *  - { id, isEnabled }        toggle a theme on/off
 *  - { id, setDefault: true } make this the site default (clears others)
 *  - { order: string[] }      full reorder, array of theme ids in new order
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  if (Array.isArray(body.order)) {
    await Promise.all(
      body.order.map((id: string, i: number) => prisma.theme.update({ where: { id }, data: { sortOrder: i } }))
    );
    return NextResponse.json({ success: true });
  }

  if (body.setDefault && body.id) {
    const target = await prisma.theme.findUnique({ where: { id: body.id } });
    if (!target?.isEnabled) {
      return NextResponse.json({ error: "Enable the theme before making it the default" }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.theme.updateMany({ where: { isDefault: true }, data: { isDefault: false } }),
      prisma.theme.update({ where: { id: body.id }, data: { isDefault: true } }),
    ]);
    return NextResponse.json({ success: true });
  }

  if (body.id && typeof body.isEnabled === "boolean") {
    const target = await prisma.theme.findUnique({ where: { id: body.id } });
    if (target?.isDefault && !body.isEnabled) {
      return NextResponse.json({ error: "Can't disable the current default theme" }, { status: 400 });
    }
    await prisma.theme.update({ where: { id: body.id }, data: { isEnabled: body.isEnabled } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
