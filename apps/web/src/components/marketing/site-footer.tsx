import Link from "next/link";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { Logo } from "@/components/logo";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Features", href: "/#features" },
  { label: "Core loop", href: "/#loop" },
  { label: "How it works", href: "/#how" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Docs", href: "/docs" },
  { label: "Dashboard", href: "/dashboard" },
];

const SOCIALS: { label: string; href: string; icon: typeof Github }[] = [
  { label: "Twitter", href: "https://x.com/iamsaurabhr", icon: Twitter },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/saurabh-ravte/",
    icon: Linkedin,
  },
  {
    label: "GitHub",
    href: "https://github.com/saurabhravte/shipflowAI",
    icon: Github,
  },
  { label: "Email", href: "mailto:saurabh.ravte@gmail.com", icon: Mail },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Centered brand + nav */}
        <div className="flex flex-col items-center gap-6 py-14">
          <Link href="/" className="group inline-flex items-center">
            <Logo size="md" />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Dotted divider */}
        <div className="border-t border-dashed border-border/70" />

        {/* Copyright + socials */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ShipFlow AI. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="flex size-9 items-center justify-center rounded-[0.6rem] border border-border/70 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
