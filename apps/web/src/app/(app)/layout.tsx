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
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
