import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  showOnline: z.boolean().optional(),
  showLastSeen: z.boolean().optional(),
  hideProfile: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { showOnline, showLastSeen, hideProfile } = parsed.data;
  const profile = await prisma.profile.update({
    where: { userId },
    data: {
      ...(showOnline !== undefined ? { showOnline } : {}),
      ...(showLastSeen !== undefined ? { showLastSeen } : {}),
      ...(hideProfile !== undefined ? { hiddenFromDiscovery: hideProfile } : {}),
    },
  });

  return NextResponse.json({ profile });
}
