import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

/**
 * NextAuth uses stateless JWT sessions, so there's no server-side session
 * table to delete rows from. Instead we bump sessionVersion; the jwt()
 * callback in lib/auth/options.ts compares it on every request and rejects
 * tokens minted before the bump, which effectively logs out every device.
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
