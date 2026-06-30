"use client";

import { useEffect, useState } from "react";
import {
  MessageSquareText,
  FileText,
  ListTree,
  GitPullRequest,
  ShieldCheck,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  {
    num: "01",
    tag: "Phase 1",
    title: "Product discovery",
    body: "Intake requests, clarify with AI, educate if the feature already exists.",
    icon: MessageSquareText,
  },
  {
    num: "02",
    tag: "Phase 2",
    title: "Planning",
    body: "Structured PRDs become kanban tasks — teams approve before dev.",
    icon: FileText,
  },
  {
    num: "03",
    tag: "Phase 3",
    title: "Development",
    body: "GitHub repos connected; PRs implement PRD requirements.",
    icon: ListTree,
  },
  {
    num: "04",
    tag: "Phase 4",
    title: "AI review loop",
    body: "QA agent reviews against PRD, criteria, security, and edge cases.",
    icon: GitPullRequest,
  },
  {
    num: "05",
    tag: "Phase 5",
    title: "Human approval",
    body: "Reviewers verify everything — only then does it ship.",
    icon: ShieldCheck,
  },
] as const;

export function DeliveryLoop() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % PHASES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const phase = PHASES[active]!;
  const Icon = phase.icon;

  return (
    <div className="grid items-stretch gap-8 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {PHASES.map((p, i) => {
          const PhaseIcon = p.icon;
          const isActive = i === active;
          return (
            <button
              key={p.num}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "card-hover group relative flex flex-col gap-3 rounded-[var(--radius-xl)] border p-5 text-left transition-all duration-500",
                isActive
                  ? "border-accent/50 bg-accent/10 shadow-[0_0_32px_-12px_var(--accent)]"
                  : "border-border/70 bg-card/40 hover:border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-data text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {p.tag}
                </span>
                <span className="font-data text-xs text-accent">{p.num}</span>
              </div>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-[0.6rem] transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-accent/15 group-hover:text-accent",
                )}
              >
                <PhaseIcon className="size-4" />
              </span>
              <div>
                <h3 className="font-display text-sm font-semibold">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
              {i < PHASES.length - 1 ? (
                <ArrowRight className="absolute -right-3 top-1/2 hidden size-4 -translate-y-1/2 text-border xl:block" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[var(--radius-2xl)] border border-border/70 bg-card/60 p-6">
        <div className="pointer-events-none absolute inset-0 bg-dot opacity-40" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            <span className="font-data text-xs text-muted-foreground">
              core loop · live
            </span>
          </div>
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-[0.75rem] transition-all duration-500",
              "bg-accent text-accent-foreground shadow-[0_0_24px_-6px_var(--accent)]",
            )}
          >
            <Icon className="size-6" />
          </span>
          <p className="mt-4 font-data text-[10px] uppercase tracking-widest text-accent">
            {phase.tag}
          </p>
          <h3 className="mt-2 font-display text-xl font-bold tracking-tight">
            {phase.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {phase.body}
          </p>
        </div>
        <div className="relative mt-6 flex items-center gap-2 border-t border-border/60 pt-4">
          <Rocket className="size-4 text-accent" />
          <span className="font-data text-xs text-muted-foreground">
            Request → PRD → Tasks → Code → Review → Ship
          </span>
        </div>
        <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${((active + 1) / PHASES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
