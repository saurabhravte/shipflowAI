"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, GitPullRequest, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Projects", icon: FolderKanban },
  {
    href: "/dashboard/pull-requests",
    label: "Pull Requests",
    icon: GitPullRequest,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border/60 bg-card/40">
      <div className="flex h-16 items-center border-b border-border/60 px-5">
        <Link href="/" className="group flex items-center">
          <Logo size="md" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-3 pb-1 pt-2 font-data text-[11px] uppercase tracking-widest text-muted-foreground">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-[0.65rem] px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
              )}
              <Icon
                className={cn("size-4", active ? "text-accent" : "")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-[0.65rem] px-3 py-2 text-sm font-medium transition-colors",
            isActive("/dashboard/settings")
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
