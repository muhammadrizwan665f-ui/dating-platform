import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_THEME } from "@dating-platform/shared";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "DilMil — Meet. Match. Connect. ❤️",
    template: "%s | DilMil",
  },
  description:
    "An 18+ dating and social discovery community for Pakistan. Verified profiles, private chat, and real connections.",
  robots: { index: true, follow: true },
};

async function resolveTheme(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { theme: true } });
      if (user?.theme) return user.theme;
    }

    const siteDefault = await prisma.theme.findFirst({ where: { isDefault: true, isEnabled: true }, select: { id: true } });
    return siteDefault?.id || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await resolveTheme();
  return (
    <html lang="en" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
