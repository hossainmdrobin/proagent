import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getCurrentUser, requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  await requireSession();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.isEmailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  return (
    <main className="flex w-full flex-1 justify-center px-4 py-10 sm:py-16">
      <DashboardView user={user} />
    </main>
  );
}
