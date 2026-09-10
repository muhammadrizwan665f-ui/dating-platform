import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  subject: z.string().min(2).max(150),
  category: z.enum(["Account", "Payment", "Membership", "Profile", "Chat", "Safety", "Reporting"]),
  message: z.string().min(5).max(3000),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Support requests are accepted whether or not the person is logged in
  // (e.g. someone locked out of their account), but we still attach the
  // user id when a session is present so admins have full context.
  const userId = await getCurrentUserId(req);

  const ticket = await prisma.supportTicket.create({
    data: { ...parsed.data, userId: userId ?? undefined },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
