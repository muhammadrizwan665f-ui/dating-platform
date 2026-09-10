import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES, PAYMENT_STATUS } from "@dating-platform/shared";

const submitSchema = z.object({
  planId: z.string().cuid(),
  methodId: z.string().cuid(),
  amount: z.number().int().positive(),
  txnRef: z.string().min(3).max(100),
  paymentDate: z.coerce.date(),
  proofUrl: z.string().url().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = submitSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payment = await prisma.payment.create({
    data: { userId, status: PAYMENT_STATUS.PENDING_REVIEW, ...parsed.data },
  });

  // Notify admins via the announcement channel / admin queue (implementation in phase 8).
  await notify(userId, NOTIFICATION_TYPES.PAYMENT_SUBMITTED, { paymentId: payment.id });

  return NextResponse.json({ payment }, { status: 201 });
}
