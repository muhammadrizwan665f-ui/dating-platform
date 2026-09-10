import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Membership plans — admin can edit price/duration/features later from the panel.
  await prisma.membershipPlan.upsert({
    where: { name: "Basic" },
    update: {},
    create: {
      name: "Basic",
      price: 499,
      durationDays: 30,
      features: { discoveryPriority: 1, dailyLikes: 20 },
    },
  });
  await prisma.membershipPlan.upsert({
    where: { name: "Pro" },
    update: {},
    create: {
      name: "Pro",
      price: 1499,
      durationDays: 30,
      badge: "POPULAR",
      features: { discoveryPriority: 2, dailyLikes: 100, profileBadge: true },
    },
  });
  await prisma.membershipPlan.upsert({
    where: { name: "Diamond" },
    update: {},
    create: {
      name: "Diamond",
      price: 2999,
      durationDays: 30,
      badge: "BEST VALUE",
      features: { discoveryPriority: 3, dailyLikes: -1, profileBadge: true, boostCreditsMonthly: 2 },
    },
  });

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

  // Dev-only demo admin. CHANGE THIS PASSWORD before any shared/staging deploy.
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@dev.local" },
    update: {},
    create: {
      email: "admin@dev.local",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Seed complete: 3 membership plans, 2 payment methods, 1 dev admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
