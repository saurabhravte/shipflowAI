"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, KeyRound, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    title: "Getting started",
    items: [
      { href: "/docs", label: "How it works", icon: BookOpen },
      { href: "/docs/setup", label: "Quick setup", icon: Rocket },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        href: "/docs/bring-your-own-key",
        label: "Bring your own key",
        icon: KeyRound,
      },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-6">
      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1.5">
          <p className="px-3 font-data text-[11px] uppercase tracking-widest text-muted-foreground">
            {section.title}
          </p>
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-[0.6rem] px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
