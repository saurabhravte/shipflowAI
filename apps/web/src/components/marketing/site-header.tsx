"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, BookOpen, KeyRound, Rocket, ChevronDown } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#loop", label: "Core loop" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const DOC_LINKS = [
  {
    href: "/docs",
    label: "How it works",
    desc: "The request-to-merge pipeline, end to end.",
    icon: BookOpen,
  },
  {
    href: "/docs/bring-your-own-key",
    label: "Bring your own key",
    desc: "Plug in your own model API key in minutes.",
    icon: KeyRound,
  },
  {
    href: "/docs/setup",
    label: "Quick setup",
    desc: "Connect GitHub and ship in under 10 minutes.",
    icon: Rocket,
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "transition-all duration-500 ease-out",
            scrolled ? "px-4 pt-3 sm:px-6 lg:px-10" : "px-0 pt-0",
          )}
        >
          <div
            className={cn(
              "mx-auto flex items-center justify-between transition-all duration-500 ease-out",
              scrolled
                ? "h-14 max-w-4xl rounded-2xl border border-border/70 bg-background/88 px-4 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:px-5"
                : "h-16 max-w-7xl border-b border-border/40 bg-transparent px-5 backdrop-blur-[2px] lg:px-8",
            )}
          >
            <Link href="/" className="group flex shrink-0 items-center">
              <Logo size="md" />
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-[0.6rem] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}

              <div className="group relative">
                <button className="flex items-center gap-1 rounded-[0.6rem] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground">
                  Docs
                  <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-1/2 top-full w-80 -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-popover/95 p-2 shadow-2xl backdrop-blur-xl">
                    {DOC_LINKS.map((d) => {
                      const Icon = d.icon;
                      return (
                        <Link
                          key={d.href}
                          href={d.href}
                          className="flex items-start gap-3 rounded-[0.7rem] p-3 transition-colors hover:bg-accent/10"
                        >
                          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[0.6rem] bg-accent/10 text-accent ring-1 ring-accent/20">
                            <Icon className="size-4" />
                          </span>
                          <span className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {d.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {d.desc}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>

            <button
              className="flex size-10 items-center justify-center rounded-[0.65rem] text-foreground transition-colors hover:bg-accent/10 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 shrink-0" aria-hidden />

      {/* Mobile menu */}
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "fixed z-50 overflow-hidden transition-all duration-300 md:hidden",
              scrolled
                ? "inset-x-4 top-[calc(0.75rem+3.5rem)] sm:inset-x-6"
                : "inset-x-0 top-16",
            )}
          >
            <div
              className={cn(
                "overflow-hidden border border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl",
                scrolled ? "rounded-2xl" : "border-x-0 border-t",
              )}
            >
              <div className="flex max-h-[calc(100dvh-5rem)] flex-col gap-1 overflow-y-auto px-4 py-4">
                {[
                  ...NAV_LINKS,
                  ...DOC_LINKS.map((d) => ({ href: d.href, label: d.label })),
                ].map((l) => (
                  <Link
                    key={l.href + l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-[0.6rem] px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="mt-2 flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/sign-in" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/sign-up" onClick={() => setOpen(false)}>
                      Get started
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
