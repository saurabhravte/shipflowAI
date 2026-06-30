"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FolderKanban,
  GitPullRequest,
  MessageSquarePlus,
  CheckSquare,
  KeyRound,
  Github,
  CreditCard,
  Settings,
  BookOpen,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useTRPC } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const MAIN_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/approvals", label: "Approvals", icon: CheckSquare, badge: "pending" as const },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/repositories", label: "Repositories", icon: Github },
  { href: "/dashboard/requests", label: "Requests", icon: MessageSquarePlus },
  { href: "/dashboard/pull-requests", label: "Pull requests", icon: GitPullRequest },
] as const;

const WORKSPACE_NAV = [
  { href: "/dashboard/settings/api-keys", label: "API keys", icon: KeyRound },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
] as const;

function NavSection({
  title,
  items,
  pathname,
  pendingCount,
}: {
  title: string;
  items: readonly {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
    badge?: "pending";
  }[];
  pathname: string;
  pendingCount?: number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1 pt-3 font-data text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const showBadge = item.badge === "pending" && (pendingCount ?? 0) > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              active
                ? "bg-accent/12 text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
            )}
            <Icon className={cn("size-4 shrink-0", active && "text-accent")} />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <Badge variant="brand" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function UsageMeter() {
  const trpc = useTRPC();
  const billingQuery = useMemo(
    () => trpc.billing.current.queryOptions(),
    [trpc],
  );
  const { data } = useQuery({ ...billingQuery, staleTime: 120_000 });

  if (!data || data.plan !== "free") return null;

  const dailyLimit = data.limits.aiReviewsPerDay;
  const dailyUsed = data.usage.aiReviewsUsedToday;
  const pct =
    dailyLimit === -1 ? 0 : Math.min(100, (dailyUsed / dailyLimit) * 100);

  return (
    <div className="mx-3 mb-3 rounded-xl border border-border/70 bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <Sparkles className="size-3.5 text-accent" />
          AI reviews today
        </span>
        <Badge variant="outline" className="text-[10px] capitalize">
          {data.plan}
        </Badge>
      </div>
      <div className="mb-1.5 flex justify-between font-data text-[11px] text-muted-foreground">
        <span>{dailyUsed} used</span>
        <span>{dailyLimit === -1 ? "∞" : `${dailyLimit} / day`}</span>
      </div>
      {dailyLimit !== -1 && <Progress value={pct} className="h-1.5" />}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const trpc = useTRPC();
  const pendingQuery = useMemo(
    () => trpc.approval.listPending.queryOptions(),
    [trpc],
  );
  const { data: pending } = useQuery({ ...pendingQuery, staleTime: 30_000 });

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-card/30">
      <div className="flex h-16 items-center border-b border-border/60 px-4">
        <Link href="/dashboard" className="group flex items-center">
          <Logo size="md" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto p-2">
        <NavSection
          title="Pipeline"
          items={MAIN_NAV}
          pathname={pathname}
          pendingCount={pending?.length}
        />
        <NavSection title="Workspace" items={WORKSPACE_NAV} pathname={pathname} />
      </nav>

      <UsageMeter />

      <div className="space-y-0.5 border-t border-border/60 p-2">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/dashboard/settings"
              ? "bg-accent/12 text-foreground"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <Link
          href="/docs"
          target="_blank"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          <BookOpen className="size-4" />
          Documentation
          <ExternalLink className="ml-auto size-3.5 opacity-50" />
        </Link>
      </div>
    </aside>
  );
}
