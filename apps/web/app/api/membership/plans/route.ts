import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  // Prices/features come entirely from the database, editable from the admin panel —
  // nothing about pricing is hardcoded in the frontend or API layer.
  return NextResponse.json({ plans });
}
