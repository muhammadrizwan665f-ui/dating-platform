import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    totalUsers,
    maleUsers,
    femaleUsers,
    pendingProfiles,
    pendingPayments,
    activeSubscriptions,
    matches,
    messages,
    openReports,
    suspended,
    banned,
    revenueAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count({ where: { gender: "MALE" } }),
    prisma.profile.count({ where: { gender: "FEMALE" } }),
    prisma.profile.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.payment.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.match.count(),
    prisma.message.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
    prisma.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    totalUsers,
    maleUsers,
    femaleUsers,
    pendingProfiles,
    pendingPayments,
    activeSubscriptions,
    matches,
    messages,
    openReports,
    suspended,
    banned,
    revenue: revenueAgg._sum.amount ?? 0,
  });
}
