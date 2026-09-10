import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { assertOfMinimumAge, UnderageError } from "@/lib/age";
import { USER_STATUS, PROFILE_STATUS } from "@dating-platform/shared";

const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  displayName: z.string().min(2).max(30),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  dob: z.coerce.date(),
  gender: z.enum(["MALE", "FEMALE"]),
  city: z.string().min(1),
  interestedIn: z.enum(["MALE", "FEMALE"]),
  termsAccepted: z.literal(true),
  confirmedAdult: z.literal(true),
});

export async function POST(req: NextRequest) {
  const parsed = registerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Server-side age gate — the checkbox above is UX only, this is the real check.
  try {
    assertOfMinimumAge(data.dob);
  } catch (err) {
    if (err instanceof UnderageError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email or phone already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      passwordHash,
      status: USER_STATUS.PENDING, // becomes ACTIVE after phone OTP verification
      profile: {
        create: {
          displayName: data.displayName,
          dob: data.dob,
          gender: data.gender,
          city: data.city,
          status: PROFILE_STATUS.DRAFT,
        },
      },
      preferences: {
        create: { interestedIn: data.interestedIn },
      },
    },
    select: { id: true },
  });

  // TODO(phase 3): trigger OTP send via lib/notifications/otp.ts

  return NextResponse.json({ userId: user.id }, { status: 201 });
}
