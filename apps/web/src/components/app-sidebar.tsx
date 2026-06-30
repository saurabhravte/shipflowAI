"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  GitPullRequest,
  Settings,
  Github,
  CreditCard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut, useSession } from "@/lib/auth-client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Projects", icon: FolderKanban },
  {
    href: "/dashboard/pull-requests",
    label: "Pull Requests",
    icon: GitPullRequest,
  },
  { href: "/dashboard/settings/github", label: "GitHub", icon: Github },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="flex h-16 items-center border-b border-border/60 px-4">
        <Link href="/" className="group flex items-center">
          <Logo size="md" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-3 pb-1 pt-2 font-data text-[11px] uppercase tracking-widest text-muted-foreground">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")) ||
            (item.href === "/dashboard" && pathname === "/dashboard");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-[0.65rem] px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-transform group-hover:scale-110",
                  active ? "text-accent" : "",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-xs font-semibold uppercase text-accent">
            {(session?.user.name ?? "?").slice(0, 1)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {session?.user.name ?? "—"}
            </span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-left text-xs text-muted-foreground transition-colors hover:text-accent"
            >
              <LogOut className="size-3" /> Sign out
            </button>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
