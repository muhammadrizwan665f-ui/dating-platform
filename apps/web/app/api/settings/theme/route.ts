import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET the list of enabled themes plus the current user's selected theme. */
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);

  const [themes, user] = await Promise.all([
    prisma.theme.findMany({ where: { isEnabled: true }, orderBy: { sortOrder: "asc" } }),
    userId ? prisma.user.findUnique({ where: { id: userId }, select: { theme: true } }) : null,
  ]);

  return NextResponse.json({ themes, current: user?.theme ?? null });
}

/** PATCH — the logged-in user changes their own theme preference. */
export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { theme } = await req.json();
  if (!theme || typeof theme !== "string") {
    return NextResponse.json({ error: "theme is required" }, { status: 400 });
  }

  const exists = await prisma.theme.findFirst({ where: { id: theme, isEnabled: true } });
  if (!exists) return NextResponse.json({ error: "Unknown or disabled theme" }, { status: 400 });

  await prisma.user.update({ where: { id: userId }, data: { theme } });
  return NextResponse.json({ success: true, theme });
}
