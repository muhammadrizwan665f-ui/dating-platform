import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  targetType: z.enum(["PROFILE", "POST", "COMMENT", "MESSAGE", "USER"]),
  targetId: z.string().min(1),
  reason: z.enum([
    "FAKE_PROFILE",
    "SPAM",
    "HARASSMENT",
    "SCAM",
    "IMPERSONATION",
    "INAPPROPRIATE_CONTENT",
    "THREATENING_BEHAVIOUR",
    "OTHER",
  ]),
  details: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const reporterId = await getCurrentUserId(req);
  if (!reporterId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const report = await prisma.report.create({
    data: { reporterId, status: "OPEN", ...parsed.data },
  });

  return NextResponse.json({ report }, { status: 201 });
}
