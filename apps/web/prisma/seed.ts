import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const LIFETIME_DAYS = 36500; // ~100 years — practically "lifetime" within the existing schema

  // Membership plans — admin can edit price/duration/features later from the panel.
  // All 3 are lifetime by default; admin can change any plan back to a fixed
  // duration any time from Admin > Membership Plans.
  await prisma.membershipPlan.upsert({
    where: { name: "Basic" },
    update: { durationDays: LIFETIME_DAYS },
    create: {
      name: "Basic",
      price: 499,
      durationDays: LIFETIME_DAYS,
      badge: "LIFETIME",
      features: { discoveryPriority: 1, dailyLikes: 20 },
    },
  });
  await prisma.membershipPlan.upsert({
    where: { name: "Pro" },
    update: { durationDays: LIFETIME_DAYS },
    create: {
      name: "Pro",
      price: 1499,
      durationDays: LIFETIME_DAYS,
      badge: "POPULAR · LIFETIME",
      features: { discoveryPriority: 2, dailyLikes: 100, profileBadge: true },
    },
  });
  await prisma.membershipPlan.upsert({
    where: { name: "Diamond" },
    update: { durationDays: LIFETIME_DAYS },
    create: {
      name: "Diamond",
      price: 2999,
      durationDays: LIFETIME_DAYS,
      badge: "BEST VALUE · LIFETIME",
      features: { discoveryPriority: 3, dailyLikes: -1, profileBadge: true, boostCreditsMonthly: 2 },
    },
  });

  // Boost plans — admin can edit price/duration/status from Admin > Boosts.
  const boostSeeds = [
    { id: "seed-boost-30m", name: "30 Minute Boost", durationMinutes: 30, price: 99 },
    { id: "seed-boost-1h", name: "1 Hour Boost", durationMinutes: 60, price: 149 },
    { id: "seed-boost-3h", name: "3 Hour Boost", durationMinutes: 180, price: 299 },
    { id: "seed-boost-24h", name: "24 Hour Boost", durationMinutes: 1440, price: 799 },
  ];
  for (const b of boostSeeds) {
    await prisma.boostPlan.upsert({ where: { id: b.id }, update: {}, create: b });
  }

  await prisma.paymentMethod.upsert({
    where: { id: "seed-bank" },
    update: {},
    create: {
      id: "seed-bank",
      name: "Bank Transfer",
      instructions: "Set real account details from Admin > Settings > Payment Methods.",
    },
  });
  await prisma.paymentMethod.upsert({
    where: { id: "seed-easypaisa" },
    update: {},
    create: {
      id: "seed-easypaisa",
      name: "EasyPaisa",
      instructions: "Set real account details from Admin > Settings > Payment Methods.",
    },
  });
  await prisma.paymentMethod.upsert({
    where: { id: "seed-jazzcash" },
    update: {},
    create: {
      id: "seed-jazzcash",
      name: "JazzCash",
      instructions: "Set real account details from Admin > Settings > Payment Methods.",
    },
  });

  // Themes — admin can enable/disable/reorder/set default from Admin > Themes.
  const themeSeeds = [
    { id: "rose-romance", name: "Rose Romance", isDefault: true },
    { id: "cherry-love", name: "Cherry Love" },
    { id: "blush-dream", name: "Blush Dream" },
    { id: "midnight-love", name: "Midnight Love" },
    { id: "sunset-hearts", name: "Sunset Hearts" },
    { id: "lavender-love", name: "Lavender Love" },
    { id: "sweet-candy", name: "Sweet Candy" },
    { id: "royal-romance", name: "Royal Romance" },
    { id: "emerald-romance", name: "Emerald Romance" },
    { id: "neon-love", name: "Neon Love" },
  ];
  for (let i = 0; i < themeSeeds.length; i++) {
    const t = themeSeeds[i];
    await prisma.theme.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, name: t.name, isDefault: !!t.isDefault, sortOrder: i },
    });
  }

  // Admin account: reads ADMIN_EMAIL/ADMIN_PASSWORD from the environment so
  // real deployments never rely on a hardcoded default. Falls back to a
  // clearly-labelled dev-only account if those aren't set (local dev only).
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dilmil.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Seed complete: 3 membership plans, 3 payment methods, 1 admin (${adminEmail}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
