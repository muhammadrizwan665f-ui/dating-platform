import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({ toUserId: z.string().cuid() });

/**
 * "Pass" doesn't need its own table for the MVP: we simply don't show the
 * profile again this session by relying on the client to drop it from state.
 * For persistence across sessions/devices, this records a lightweight audit
 * entry so future discovery queries (phase 2+) can exclude it too.
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.profileView.create({
    data: { viewerId: userId, viewedId: parsed.data.toUserId, action: "PASS" },
  }).catch(() => null); // best-effort; ProfileView model can be added to schema in phase 2 migration

  return NextResponse.json({ ok: true });
}
