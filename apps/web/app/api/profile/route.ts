import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { publicUrlFor } from "@/lib/storage/storage";
import { PROFILE_STATUS } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { photos: { orderBy: { position: "asc" } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

const patchSchema = z.object({
  bio: z.string().max(500).optional(),
  interests: z.array(z.string().max(30)).max(15).optional(),
  intention: z.enum(["DATING", "FRIENDSHIP", "RELATIONSHIP", "NOT_SURE"]).optional(),
  city: z.string().optional(),
  education: z.string().max(100).optional(),
  profession: z.string().max(100).optional(),
  preferences: z.object({ ageMin: z.number().int().min(18), ageMax: z.number().int().max(80) }).optional(),
  photoKey: z.string().optional().nullable(),
  submit: z.boolean().optional(),
});

/** Simple weighted completeness score — used to nudge users and to boost normal discovery ranking. */
function calcCompleteness(p: { bio?: string | null; interests: string[]; hasPhoto: boolean }) {
  let score = 0;
  if (p.hasPhoto) score += 40;
  if (p.bio && p.bio.length > 10) score += 30;
  if (p.interests.length >= 3) score += 30;
  return Math.min(score, 100);
}

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { photoKey, submit, preferences, ...profileFields } = parsed.data;

  try {
    const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });

    if (photoKey) {
      const existingCount = await prisma.profilePhoto.count({ where: { profileId: profile.id } });
      await prisma.profilePhoto.create({
        data: {
          profileId: profile.id,
          url: publicUrlFor(photoKey),
          position: existingCount,
          isPrimary: existingCount === 0,
        },
      });
    }

    if (preferences) {
      // UserPreference is never created at registration time, so the first
      // time someone sets preferences (e.g. during onboarding) there is no
      // row yet — .update() would throw. upsert() handles both cases. A
      // sensible opposite-gender default is used for the required
      // interestedIn field until a dedicated preferences UI lets them change it.
      await prisma.userPreference.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          ageMin: preferences.ageMin,
          ageMax: preferences.ageMax,
          interestedIn: profile.gender === "MALE" ? "FEMALE" : "MALE",
        },
      });
    }

    const photoCount = await prisma.profilePhoto.count({ where: { profileId: profile.id } });
    const completeness = calcCompleteness({
      bio: profileFields.bio ?? profile.bio,
      interests: profileFields.interests ?? profile.interests,
      hasPhoto: photoCount > 0,
    });

    const updated = await prisma.profile.update({
      where: { userId },
      data: {
        ...profileFields,
        completeness,
        // A submission only moves DRAFT -> SUBMITTED; it never skips admin review.
        status: submit && profile.status === PROFILE_STATUS.DRAFT ? PROFILE_STATUS.SUBMITTED : profile.status,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    console.error("[PATCH /api/profile] failed:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
