import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Workflow, KeyRound } from "lucide-react";
import { getServerSession } from "@/server/auth/session";
import { Logo } from "@/components/logo";

const HIGHLIGHTS = [
  {
    icon: Workflow,
    title: "Request → merged PR",
    body: "The whole shipping pipeline in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Repo-aware AI review",
    body: "Catches the bugs diff-only tools miss.",
  },
  {
    icon: KeyRound,
    title: "Bring your own key",
    body: "Your models, your spend, your data.",
  },
];

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authSession = await getServerSession();
  if (authSession) {
    redirect("/dashboard");
  }

  return (
    <div className="dark grid min-h-screen bg-background text-foreground font-sans lg:grid-cols-2">
      {/* Branding panel */}
      <div className="relative hidden overflow-hidden border-r border-border/60 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,#000_50%,transparent_100%)]" />
        <div className="pointer-events-none absolute -left-20 top-1/3 h-96 w-96 rounded-full opacity-30 blur-3xl aurora-bg" />

        <Link href="/" className="group relative w-fit">
          <Logo size="lg" />
        </Link>

        <div className="relative flex flex-col gap-8">
          <h2 className="max-w-sm font-display text-4xl font-bold leading-tight tracking-tight">
            Ship <span className="text-gradient-brand">reviewed.</span>
          </h2>
          <div className="flex flex-col gap-5">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.6rem] bg-accent/10 text-accent ring-1 ring-accent/20">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <p className="font-display text-sm font-semibold">
                      {h.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{h.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative font-data text-xs text-muted-foreground">
          AI does the review. Humans do the deciding.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="group mb-8 flex w-fit items-center lg:hidden"
          >
            <Logo size="md" />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
