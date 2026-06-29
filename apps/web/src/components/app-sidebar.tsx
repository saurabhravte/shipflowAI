"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, GitPullRequest, Settings, Github, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { href: "/dashboard/settings/github", label: "GitHub", icon: Github },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-6 items-center justify-center rounded-md bg-accent font-data text-xs font-bold text-accent-foreground">
          SF
        </div>
        <span className="font-semibold tracking-tight">ShipFlow</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t p-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{session?.user.name ?? "—"}</span>
          <button
            onClick={() => signOut()}
            className="text-left text-xs text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
