import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const plans = await prisma.membershipPlan.findMany({ orderBy: { price: "asc" } });
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, price, durationDays, badge, features } = await req.json();
  if (!name || !price || !durationDays) {
    return NextResponse.json({ error: "name, price and durationDays are required" }, { status: 400 });
  }

  const plan = await prisma.membershipPlan.create({
    data: { name, price: Number(price), durationDays: Number(durationDays), badge: badge || null, features: features || {} },
  });
  return NextResponse.json({ success: true, plan });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, ...rest } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: any = {};
  if (rest.name !== undefined) data.name = rest.name;
  if (rest.price !== undefined) data.price = Number(rest.price);
  if (rest.durationDays !== undefined) data.durationDays = Number(rest.durationDays);
  if (rest.badge !== undefined) data.badge = rest.badge || null;
  if (rest.isActive !== undefined) data.isActive = !!rest.isActive;
  if (rest.features !== undefined) data.features = rest.features;

  const plan = await prisma.membershipPlan.update({ where: { id }, data });
  return NextResponse.json({ success: true, plan });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  await prisma.membershipPlan.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
