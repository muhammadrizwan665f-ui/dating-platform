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

  const [user, profile, activeSub, unreadNotifications] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.profile.findUnique({
      where: { userId },
      select: { status: true, displayName: true, photos: { where: { isPrimary: true }, take: 1, select: { url: true } } },
    }),
    prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE", endDate: { gt: new Date() } },
      include: { plan: { select: { badge: true } } },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  // Profile setup + payment is mandatory before the app opens up. A DRAFT
  // profile means they haven't finished onboarding (photo + payment) yet —
  // send them back there instead of letting them wander into Discover/Feed/
  // Dashboard with an incomplete, unreviewable profile. Admins/moderators
  // don't have a dating profile at all, so they're exempt.
  const isStaff = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MODERATOR";
  if (!isStaff && profile?.status === "DRAFT") {
    redirect("/onboarding");
  }

  const viewer = {
    displayName: profile?.displayName ?? null,
    photoUrl: profile?.photos[0]?.url ?? null,
    membershipBadge: activeSub?.plan?.badge ?? null,
    unreadNotifications,
  };

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
