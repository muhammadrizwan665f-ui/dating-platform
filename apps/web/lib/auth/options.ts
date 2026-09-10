import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { USER_STATUS } from "../../../packages/shared/constants";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: credentials.identifier }, { phone: credentials.identifier }],
          },
        });
        if (!user) return null;

        if (user.status === USER_STATUS.BANNED || user.status === USER_STATUS.DELETED) {
          throw new Error("This account is not available.");
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email ?? undefined, role: user.role, sessionVersion: user.sessionVersion } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.sessionVersion = (user as any).sessionVersion ?? 0;
      }
      // On every subsequent request, re-check against the DB. If an admin or
      // the user themself bumped sessionVersion (ban, logout-all-devices),
      // this token is stale and the session is force-invalidated.
      if (token.id) {
        const current = await prisma.user.findUnique({ where: { id: token.id as string }, select: { sessionVersion: true, status: true } });
        if (!current || current.status === "BANNED" || current.status === "DELETED" || current.sessionVersion !== token.sessionVersion) {
          return {};
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      } else {
        // Invalidated token -> no usable session.
        return { ...session, user: undefined, expires: new Date(0).toISOString() } as any;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};
