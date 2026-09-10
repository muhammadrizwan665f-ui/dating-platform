import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { PROFILE_STATUS, USER_STATUS } from "../../../../../packages/shared/constants";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Soft-delete: deactivate account + profile so discovery/matching/chat stop
  // immediately, but payments/audit_logs are never removed (financial/legal
  // retention — spec §57). A hard-delete/anonymization job can run later on
  // a retention schedule against USER_STATUS.DELETED accounts.
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status: USER_STATUS.DELETED } }),
    prisma.profile.update({ where: { userId }, data: { status: PROFILE_STATUS.SUSPENDED } }),
  ]);

  return NextResponse.json({ ok: true });
}
