"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Github, CreditCard, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/settings", label: "Profile", icon: User },
  { href: "/dashboard/settings/api-keys", label: "API keys", icon: KeyRound },
  { href: "/dashboard/settings/github", label: "GitHub", icon: Github },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Profile, your own API key, GitHub repos, and billing — all in one place.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border/70">
        {TABS.map((tab) => {
          const active =
            tab.href === "/dashboard/settings"
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
