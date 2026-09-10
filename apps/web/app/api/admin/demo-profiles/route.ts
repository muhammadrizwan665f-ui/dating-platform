import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Hyderabad"];
const MALE_NAMES = ["Ahmed", "Bilal", "Hamza", "Usman", "Faisal", "Zeeshan", "Hassan", "Imran", "Tariq", "Waqas", "Adeel", "Kashif"];
const FEMALE_NAMES = ["Ayesha", "Sana", "Mahnoor", "Hira", "Zainab", "Fatima", "Sadia", "Nida", "Amna", "Rabia", "Komal", "Iqra"];
const INTERESTS_POOL = ["Cricket", "Travel", "Cooking", "Poetry", "Movies", "Music", "Reading", "Fitness", "Photography", "Art", "Gaming", "Hiking", "Fashion", "Tech"];
const PROFESSIONS = ["Software Engineer", "Doctor", "Teacher", "Entrepreneur", "Designer", "Marketing Manager", "Architect", "Student", "Accountant", "Lawyer"];
const BIO_TEMPLATES = [
  "Coffee enthusiast who loves long conversations and longer walks.",
  "Here for genuine connections, not just small talk.",
  "Big fan of weekend getaways and trying new restaurants.",
  "Family-oriented, ambitious, and always up for an adventure.",
  "Book lover by night, foodie by day.",
  "Looking for someone to share laughs and good food with.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomAge() {
  return 20 + Math.floor(Math.random() * 20); // 20-39
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

/** POST { count, gender? } — bulk-generates clearly-labeled demo profiles. */
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { count = 10, gender } = await req.json();
  const n = Math.min(Math.max(Number(count) || 10, 1), 100);
  const passwordHash = await bcrypt.hash("DemoAccount123!", 12);

  const created = [];
  for (let i = 0; i < n; i++) {
    const g = gender === "MALE" || gender === "FEMALE" ? gender : pick(["MALE", "FEMALE"]);
    const name = g === "MALE" ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
    const age = randomAge();
    const email = `demo.${name.toLowerCase()}.${Date.now()}.${i}@dilmil.demo`;
    const seed = `${name}-${i}-${Date.now()}`;
    // Synthetic illustrated avatars (not photos of real people) — appropriate
    // for auto-generated demo/test data.
    const photoUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}`;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            displayName: name,
            dob: new Date(new Date().getFullYear() - age, 0, 1),
            gender: g,
            city: pick(CITIES),
            bio: pick(BIO_TEMPLATES),
            interests: [pick(INTERESTS_POOL), pick(INTERESTS_POOL), pick(INTERESTS_POOL)],
            intention: pick(["DATING", "FRIENDSHIP", "RELATIONSHIP"]),
            profession: pick(PROFESSIONS),
            status: "APPROVED",
            verified: true,
            completeness: 100,
            isDemo: true,
            photos: { create: [{ url: photoUrl, position: 0, isPrimary: true, moderationStatus: "APPROVED" }] },
          },
        },
      },
      include: { profile: true },
    });
    created.push(user.profile);
  }

  return NextResponse.json({ success: true, created: created.length });
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
