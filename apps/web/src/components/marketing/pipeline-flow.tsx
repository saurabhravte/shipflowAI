"use client";

import { useEffect, useState } from "react";
import {
  MessageSquareText,
  FileText,
  ListTree,
  Code2,
  ShieldCheck,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { label: "Request", sub: "Raw idea in", icon: MessageSquareText },
  { label: "PRD", sub: "AI drafts spec", icon: FileText },
  { label: "Tasks", sub: "Broken down", icon: ListTree },
  { label: "Build", sub: "Code written", icon: Code2 },
  { label: "AI Review", sub: "Repo-aware", icon: ShieldCheck },
  { label: "Shipped", sub: "Merged PR", icon: GitMerge },
] as const;

export function PipelineFlow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STAGES.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-[var(--radius-2xl)] border border-border/70 bg-card/60 p-6 backdrop-blur-sm sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-dot opacity-50" />
      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            <span className="font-data text-xs text-muted-foreground">
              pipeline · live
            </span>
          </div>
          <span className="font-data text-xs text-muted-foreground">
            feat/csv-export
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isActive = i === active;
            const isDone =
              i < active || (active === 0 && i === STAGES.length - 1 && false);
            return (
              <div
                key={stage.label}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border p-3 text-center transition-all duration-500",
                  isActive
                    ? "border-accent/60 bg-accent/10 shadow-[0_0_30px_-10px_var(--accent)]"
                    : isDone
                      ? "border-success/40 bg-success/5"
                      : "border-border/60 bg-background/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-[0.65rem] transition-all duration-500",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : isDone
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn("size-5", isActive && "animate-pulse")}
                  />
                </span>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "font-display text-xs font-semibold transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {stage.label}
                  </span>
                  <span className="hidden text-[10px] text-muted-foreground sm:block">
                    {stage.sub}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <span className="absolute -right-2.5 top-1/2 hidden h-px w-3 -translate-y-1/2 bg-border sm:block" />
                )}
              </div>
            );
          })}
        </div>

        {/* progress rail */}
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${((active + 1) / STAGES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
