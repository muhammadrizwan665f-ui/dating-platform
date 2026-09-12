import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

/**
 * Protects every authenticated page (Dashboard/Discover/Matches/Messages/
 * Feed/Profile/Membership/Settings/etc.) and provides the shared sidebar +
 * top bar shell, so individual pages no longer need to render their own
 * navigation or worry about auth.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login?next=/dashboard");

  const [profile, activeSub, unreadNotifications] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { displayName: true, photos: { where: { isPrimary: true }, take: 1, select: { url: true } } },
    }),
    prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE", endDate: { gt: new Date() } },
      include: { plan: { select: { badge: true } } },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  const viewer = {
    displayName: profile?.displayName ?? null,
    photoUrl: profile?.photos[0]?.url ?? null,
    membershipBadge: activeSub?.plan?.badge ?? null,
    unreadNotifications,
  };

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
