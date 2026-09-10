import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const methods = await prisma.paymentMethod.findMany({ where: { isActive: true } });
  return NextResponse.json({ methods });
}
