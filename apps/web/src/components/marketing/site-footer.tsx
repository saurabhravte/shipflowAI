import Link from "next/link";
import { Github } from "lucide-react";
import { Logo } from "@/components/logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "Overview", href: "/docs" },
      { label: "Bring your own key", href: "/docs/bring-your-own-key" },
      { label: "Quick setup", href: "/docs/setup" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Create account", href: "/sign-up" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-5 py-14 md:grid-cols-5 lg:px-8">
        <div className="col-span-2 flex flex-col gap-4">
          <Link href="/" className="group inline-flex w-fit items-center">
            <Logo size="md" />
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            AI code review and an autonomous shipping pipeline — from raw
            feature request to a reviewed, merged pull request.
          </p>
          <a
            href="https://github.com/saurabhravte/shipflowAI"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-[0.6rem] border border-border/70 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent/60 hover:text-foreground"
          >
            <Github className="size-4" /> View on GitHub
          </a>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-foreground">
              {col.title}
            </h4>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} ShipFlow AI. All rights reserved.</p>
          <p className="font-data">Ship, reviewed.</p>
        </div>
      </div>
    </footer>
  );
}
