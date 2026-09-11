import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

/**
 * Mints a short-lived JWT the browser can hand to the realtime (Socket.IO)
 * server as its auth token. NextAuth's own session cookie is encrypted and
 * not directly verifiable by a plain jsonwebtoken.verify() call, so the
 * realtime server instead checks THIS token — signed with the same
 * AUTH_SECRET, containing only the user id, valid for 1 hour.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const token = jwt.sign({ id: userId }, secret, { expiresIn: "1h" });
  return NextResponse.json({ token });
}
