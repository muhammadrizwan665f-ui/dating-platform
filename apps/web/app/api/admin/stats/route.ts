import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    totalUsers,
    maleUsers,
    femaleUsers,
    activeUsers,
    pendingProfiles,
    approvedProfiles,
    rejectedProfiles,
    pendingPayments,
    approvedPayments,
    activeSubscriptions,
    matches,
    messages,
    openReports,
    suspended,
    banned,
    revenueAgg,
    todayRevenueAgg,
    monthRevenueAgg,
    demoProfiles,
    newRegistrationsToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count({ where: { gender: "MALE", isDemo: false } }),
    prisma.profile.count({ where: { gender: "FEMALE", isDemo: false } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.profile.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.profile.count({ where: { status: "APPROVED", isDemo: false } }),
    prisma.profile.count({ where: { status: "REJECTED" } }),
    prisma.payment.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.payment.count({ where: { status: "APPROVED" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.match.count(),
    prisma.message.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
    prisma.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "APPROVED", createdAt: { gte: startOfDay } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "APPROVED", createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.profile.count({ where: { isDemo: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
  ]);

  return NextResponse.json({
    totalUsers,
    maleUsers,
    femaleUsers,
    activeUsers,
    pendingProfiles,
    approvedProfiles,
    rejectedProfiles,
    pendingPayments,
    approvedPayments,
    activeSubscriptions,
    matches,
    messages,
    openReports,
    suspended,
    banned,
    revenue: revenueAgg._sum.amount ?? 0,
    todayRevenue: todayRevenueAgg._sum.amount ?? 0,
    monthRevenue: monthRevenueAgg._sum.amount ?? 0,
    demoProfiles,
    newRegistrationsToday,
  });
}
