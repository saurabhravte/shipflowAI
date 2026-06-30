"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function DashboardTopbar() {
  const { data: session } = useSession();
  const name = session?.user.name ?? "Account";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b border-border/60 bg-background/80 px-6 backdrop-blur-xl lg:px-8">
      <ThemeToggle />

      {/* Settings lives under the user profile — click the name to manage it. */}
      <Link
        href="/dashboard/settings"
        className="flex items-center gap-2 rounded-full border border-border/70 py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
          {initial}
        </span>
        <span className="max-w-40 truncate">{name}</span>
      </Link>

      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut()}
        aria-label="Log out"
      >
        <LogOut className="size-4" />
        Logout
      </Button>
    </header>
  );
}
