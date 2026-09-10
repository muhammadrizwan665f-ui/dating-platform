import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({ blockedId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const blockerId = await getCurrentUserId(req);
  if (!blockerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { blockedId } = parsed.data;
  if (blockedId === blockerId) return NextResponse.json({ error: "Cannot block yourself." }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });

    const [u1, u2] = [blockerId, blockedId].sort();
    // Hide any existing match between the two — interaction must stop immediately.
    await tx.match.updateMany({
      where: { user1Id: u1, user2Id: u2 },
      data: { status: "BLOCKED" },
    });
    await tx.connection.updateMany({
      where: {
        OR: [
          { requesterId: blockerId, addresseeId: blockedId },
          { requesterId: blockedId, addresseeId: blockerId },
        ],
      },
      data: { status: "BLOCKED" },
    });
  });

  return NextResponse.json({ blocked: true });
}

export async function DELETE(req: NextRequest) {
  const blockerId = await getCurrentUserId(req);
  if (!blockerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.block.deleteMany({ where: { blockerId, blockedId: parsed.data.blockedId } });
  return NextResponse.json({ blocked: false });
}
