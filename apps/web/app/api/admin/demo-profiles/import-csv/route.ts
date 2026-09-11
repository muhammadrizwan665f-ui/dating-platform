import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

/**
 * Expected CSV header (case-insensitive):
 * name,age,gender,city,bio,interests,relationship_intention,profile_photo,status
 * - interests: semicolon or comma separated
 * - status: APPROVED | DRAFT (defaults to APPROVED)
 * All imported rows are marked isDemo=true — same rule as the bulk generator.
 */
function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

const INTENTION_MAP: Record<string, string> = {
  dating: "DATING",
  friendship: "FRIENDSHIP",
  relationship: "RELATIONSHIP",
  serious: "RELATIONSHIP",
  marriage: "RELATIONSHIP",
};

export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { csv, dryRun } = await req.json();
  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "csv text is required" }, { status: 400 });
  }

  const rows = parseCsv(csv);
  if (rows.length < 2) return NextResponse.json({ error: "CSV needs a header row plus at least one data row" }, { status: 400 });

  const header = rows[0].map((h) => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    name: col("name"),
    age: col("age"),
    gender: col("gender"),
    city: col("city"),
    bio: col("bio"),
    interests: col("interests"),
    intention: col("relationship_intention"),
    photo: col("profile_photo"),
    status: col("status"),
  };
  if (idx.name === -1 || idx.age === -1 || idx.gender === -1) {
    return NextResponse.json({ error: "CSV must include at least: name, age, gender columns" }, { status: 400 });
  }

  const dataRows = rows.slice(1);
  const errors: string[] = [];
  const preview: any[] = [];
  let successCount = 0;

  const passwordHash = dryRun ? "" : await bcrypt.hash("DemoAccount123!", 12);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 2; // +2 for 1-indexed + header row
    try {
      const name = row[idx.name]?.trim();
      const age = Number(row[idx.age]);
      const genderRaw = row[idx.gender]?.trim().toUpperCase();
      const gender = genderRaw === "MALE" || genderRaw === "FEMALE" ? genderRaw : null;

      if (!name) throw new Error("Missing name");
      if (!age || age < 18 || age > 90) throw new Error("Invalid age (must be 18-90)");
      if (!gender) throw new Error("Gender must be MALE or FEMALE");

      const city = idx.city >= 0 ? row[idx.city]?.trim() || "Lahore" : "Lahore";
      const bio = idx.bio >= 0 ? row[idx.bio]?.trim() || null : null;
      const interestsRaw = idx.interests >= 0 ? row[idx.interests] || "" : "";
      const interests = interestsRaw.split(/[;|]/).map((s) => s.trim()).filter(Boolean);
      const intentionRaw = idx.intention >= 0 ? row[idx.intention]?.trim().toLowerCase() : "";
      const intention = INTENTION_MAP[intentionRaw] || "NOT_SURE";
      const photo = idx.photo >= 0 ? row[idx.photo]?.trim() : "";
      const statusRaw = idx.status >= 0 ? row[idx.status]?.trim().toUpperCase() : "APPROVED";
      const status = statusRaw === "DRAFT" ? "DRAFT" : "APPROVED";

      preview.push({ row: rowNum, name, age, gender, city, intention, status });

      if (!dryRun) {
        const email = `demo.csv.${name.toLowerCase().replace(/\s+/g, "")}.${Date.now()}.${i}@dilmil.demo`;
        const photoUrl = photo || `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(name + i)}`;

        await prisma.user.create({
          data: {
            email,
            passwordHash,
            role: "USER",
            status: "ACTIVE",
            profile: {
              create: {
                displayName: name,
                dob: new Date(new Date().getFullYear() - age, 0, 1),
                gender: gender as any,
                city,
                bio,
                interests,
                intention: intention as any,
                status: status as any,
                verified: status === "APPROVED",
                completeness: 100,
                isDemo: true,
                photos: photoUrl ? { create: [{ url: photoUrl, position: 0, isPrimary: true, moderationStatus: "APPROVED" }] } : undefined,
              },
            },
          },
        });
      }
      successCount++;
    } catch (e: any) {
      errors.push(`Row ${rowNum}: ${e.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    dryRun: !!dryRun,
    totalRows: dataRows.length,
    successCount,
    failedCount: errors.length,
    errors: errors.slice(0, 20),
    preview: dryRun ? preview.slice(0, 20) : undefined,
  });
}
