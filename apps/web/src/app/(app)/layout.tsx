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
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
