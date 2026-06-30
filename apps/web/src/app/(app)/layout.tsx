import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const authSession = await getServerSession();
  if (!authSession) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-dot opacity-[0.35]" />
        <DashboardTopbar />
        <main className="relative flex-1 overflow-y-auto">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
