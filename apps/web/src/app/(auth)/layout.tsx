import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const authSession = await getServerSession();
  if (authSession) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
