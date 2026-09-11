import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const plans = await prisma.boostPlan.findMany({ orderBy: { durationMinutes: "asc" } });
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, durationMinutes, price } = await req.json();
  if (!name || !durationMinutes || !price) {
    return NextResponse.json({ error: "name, durationMinutes and price are required" }, { status: 400 });
  }
  const plan = await prisma.boostPlan.create({ data: { name, durationMinutes: Number(durationMinutes), price: Number(price) } });
  return NextResponse.json({ success: true, plan });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, ...rest } = await req.json();
  const data: any = {};
  if (rest.name !== undefined) data.name = rest.name;
  if (rest.durationMinutes !== undefined) data.durationMinutes = Number(rest.durationMinutes);
  if (rest.price !== undefined) data.price = Number(rest.price);
  if (rest.isActive !== undefined) data.isActive = !!rest.isActive;

  const plan = await prisma.boostPlan.update({ where: { id }, data });
  return NextResponse.json({ success: true, plan });
}
