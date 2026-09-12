import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

const ALL_CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"];
const MALE_NAMES = ["Ahmed", "Bilal", "Hamza", "Usman", "Faisal", "Zeeshan", "Hassan", "Imran", "Tariq", "Waqas", "Adeel", "Kashif", "Danish", "Saad", "Umer", "Fahad"];
const FEMALE_NAMES = ["Ayesha", "Sana", "Mahnoor", "Hira", "Zainab", "Fatima", "Sadia", "Nida", "Amna", "Rabia", "Komal", "Iqra", "Anum", "Laiba", "Maryam", "Noor"];
const INTERESTS_POOL = ["Cricket", "Travel", "Cooking", "Poetry", "Movies", "Music", "Reading", "Fitness", "Photography", "Art", "Gaming", "Hiking", "Fashion", "Tech", "Dance", "Yoga"];
const PROFESSIONS = ["Software Engineer", "Doctor", "Teacher", "Entrepreneur", "Designer", "Marketing Manager", "Architect", "Student", "Accountant", "Lawyer", "Nurse", "Content Creator", "Banker", "Pharmacist"];
const EDUCATION = ["Bachelor's in Business", "Master's in Computer Science", "MBBS", "Bachelor's in Engineering", "Master's in Fine Arts", "Bachelor's in Psychology", "Currently a University Student", "Master's in Economics"];
const BIO_TEMPLATES = [
  "Coffee enthusiast who loves long conversations and longer walks.",
  "Here for genuine connections, not just small talk.",
  "Big fan of weekend getaways and trying new restaurants.",
  "Family-oriented, ambitious, and always up for an adventure.",
  "Book lover by night, foodie by day.",
  "Looking for someone to share laughs and good food with.",
  "Enjoy quiet evenings just as much as spontaneous road trips.",
  "Believer in real conversations over small talk.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProfile(opts: { gender?: string; ageMin: number; ageMax: number; cities: string[]; intentions: string[] }, index: number) {
  const g = opts.gender === "MALE" || opts.gender === "FEMALE" ? opts.gender : pick(["MALE", "FEMALE"]);
  const name = g === "MALE" ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  const age = opts.ageMin + Math.floor(Math.random() * (opts.ageMax - opts.ageMin + 1));
  const seed = `${name}-${index}-${Date.now()}-${Math.random()}`;
  return {
    displayName: name,
    gender: g,
    age,
    city: pick(opts.cities.length ? opts.cities : ALL_CITIES),
    bio: pick(BIO_TEMPLATES),
    interests: [pick(INTERESTS_POOL), pick(INTERESTS_POOL), pick(INTERESTS_POOL)],
    intention: pick(opts.intentions.length ? opts.intentions : ["DATING", "FRIENDSHIP", "RELATIONSHIP"]),
    profession: pick(PROFESSIONS),
    education: pick(EDUCATION),
    // Synthetic illustrated avatar (not a photo of a real person) — appropriate for auto-generated demo data.
    photoUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}`,
  };
}

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [count, profiles] = await Promise.all([
    prisma.profile.count({ where: { isDemo: true } }),
    prisma.profile.findMany({
      where: { isDemo: true },
      include: { photos: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({ count, profiles });
}

/**
 * POST { count, gender?, ageMin?, ageMax?, cities?, intentions?, dryRun? }
 * dryRun=true returns generated profiles WITHOUT writing to the database —
 * used for the admin preview step before committing to create anything.
 */
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const n = Math.min(Math.max(Number(body.count) || 10, 1), 1000);
  const ageMin = Math.max(18, Number(body.ageMin) || 21);
  const ageMax = Math.min(65, Number(body.ageMax) || 35);
  const cities: string[] = Array.isArray(body.cities) && body.cities.length ? body.cities : ALL_CITIES;
  const intentions: string[] = Array.isArray(body.intentions) && body.intentions.length ? body.intentions : ["DATING", "FRIENDSHIP", "RELATIONSHIP"];
  const dryRun = !!body.dryRun;

  const generated = Array.from({ length: n }, (_, i) => generateProfile({ gender: body.gender, ageMin, ageMax, cities, intentions }, i));

  if (dryRun) {
    return NextResponse.json({ success: true, dryRun: true, count: n, preview: generated.slice(0, 24), all: generated });
  }

  const passwordHash = await bcrypt.hash("DemoAccount123!", 12);
  let successCount = 0;

  // Chunked, but still awaited sequentially per-chunk to avoid overwhelming
  // the DB connection pool on very large (500-1000) batches.
  const CHUNK = 20;
  for (let i = 0; i < generated.length; i += CHUNK) {
    const chunk = generated.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((g, j) =>
        prisma.user.create({
          data: {
            email: `demo.${g.displayName.toLowerCase()}.${Date.now()}.${i + j}.${Math.floor(Math.random() * 1e6)}@dilmil.demo`,
            passwordHash,
            role: "USER",
            status: "ACTIVE",
            profile: {
              create: {
                displayName: g.displayName,
                dob: new Date(new Date().getFullYear() - g.age, 0, 1),
                gender: g.gender as any,
                city: g.city,
                bio: g.bio,
                interests: g.interests,
                intention: g.intention as any,
                profession: g.profession,
                education: g.education,
                status: "APPROVED",
                verified: true,
                completeness: 100,
                isDemo: true,
                photos: { create: [{ url: g.photoUrl, position: 0, isPrimary: true, moderationStatus: "APPROVED" }] },
              },
            },
          },
        })
      )
    );
    successCount += chunk.length;
  }

  return NextResponse.json({ success: true, created: successCount });
}

/** DELETE — remove all demo profiles (and their user accounts) in one go. */
export async function DELETE(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const demoProfiles = await prisma.profile.findMany({ where: { isDemo: true }, select: { userId: true } });
  const userIds = demoProfiles.map((p) => p.userId);

  if (userIds.length > 0) {
    await prisma.profilePhoto.deleteMany({ where: { profile: { isDemo: true } } });
    await prisma.profile.deleteMany({ where: { isDemo: true } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  return NextResponse.json({ success: true, deleted: userIds.length });
}
