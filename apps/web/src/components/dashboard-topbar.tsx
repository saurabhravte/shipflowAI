"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/lib/trpc";

export function DashboardTopbar() {
  const trpc = useTRPC();
  const { data: session } = useSession();
  const { data: connected } = useQuery(trpc.workspace.connectedAccounts.queryOptions());

  const name = session?.user.name ?? "Account";
  const imageUrl =
    session?.user.image ?? connected?.providers.find((p) => p.avatarUrl)?.avatarUrl;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b border-border/60 bg-background/80 px-6 backdrop-blur-xl lg:px-8">
      <ThemeToggle />

      <Link
        href="/dashboard/settings"
        className="flex items-center gap-2 rounded-full border border-border/70 py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted"
      >
        <UserAvatar name={name} imageUrl={imageUrl} size="sm" />
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
