import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const match = await prisma.match.findUnique({ where: { id: params.id } });
  if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.match.update({ where: { id: params.id }, data: { status: "UNMATCHED" } });
  return NextResponse.json({ ok: true });
}
