import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { ROLES } from "@dating-platform/shared";
import { AdminSidebar } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

/**
 * Protects every route under the (admin) group. Runs server-side before any
 * admin page renders — unauthenticated visitors are sent to /login, and
 * authenticated non-admins are sent home. The underlying /api/admin/* routes
 * already re-check this independently (never trust the client), so this is
 * defense-in-depth for the page shell itself.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login?next=/admin");
  }

  const user = await prisma.user.findUnique({ where: { id: userId as string } });

  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.MODERATOR)) {
    redirect("/");
  }

  if (user.status === "BANNED" || user.status === "DELETED") {
    redirect("/login?next=/admin");
  }

  return (
    <div className="flex min-h-screen bg-[#faf7f8]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
    </div>
  );
}
