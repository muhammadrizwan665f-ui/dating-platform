import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { prisma } from "@/lib/db/prisma";

/** Returns the authenticated user's id, or null. Never trust a client-supplied userId. */
export async function getCurrentUserId(_req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/** Loads the current user and checks their role is in `allowed`. Returns the user or null. */
export async function requireRole(req: NextRequest, allowed: string[]) {
  const userId = await getCurrentUserId(req);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !allowed.includes(user.role)) return null;
  return user;
}
