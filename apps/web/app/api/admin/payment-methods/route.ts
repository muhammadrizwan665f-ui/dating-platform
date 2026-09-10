import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const methods = await prisma.paymentMethod.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ methods });
}

export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, instructions } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const method = await prisma.paymentMethod.create({ data: { name, instructions: instructions || "" } });
  return NextResponse.json({ success: true, method });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, instructions, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (instructions !== undefined) data.instructions = instructions;
  if (isActive !== undefined) data.isActive = !!isActive;

  const method = await prisma.paymentMethod.update({ where: { id }, data });
  return NextResponse.json({ success: true, method });
}
