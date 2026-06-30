"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    q: "Is ShipFlow AI a separate app or does it live in GitHub?",
    a: "Both. ShipFlow runs reviews directly on your pull requests via the GitHub App, and gives you a web dashboard to manage feature requests, PRDs, tasks, and the whole shipping pipeline in one place.",
  },
  {
    q: "How is this different from CodeRabbit, Qodo Merge, Greptile, or Korbit?",
    a: "Those tools focus on reviewing a PR once it exists. ShipFlow reviews with full-repository context AND drives the work that comes before the PR — turning a raw request into a PRD, breaking it into tasks, then reviewing the resulting code and routing it for human approval.",
  },
  {
    q: "Can I bring my own model API key?",
    a: "Yes. ShipFlow is model-agnostic via OpenRouter. Drop in your own key and pick the models you want for drafting vs. reviewing. Your key, your spend, your data boundary. See the Bring-your-own-key docs.",
  },
  {
    q: "Does ShipFlow use my code to train models?",
    a: "No. Your repositories are used only to generate reviews and artifacts for you. Nothing is used for model training. With your own API key, requests go directly to the provider you choose.",
  },
  {
    q: "Which languages and repos are supported?",
    a: "Any repository you can connect through the GitHub App — public or private. The review reasons over diffs and surrounding repo context, so it works across stacks.",
  },
  {
    q: "How long does setup take?",
    a: "Under ten minutes: sign in, connect the GitHub App to a repo, link it to a project, and open your first feature request. The quick-setup guide walks through every step.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={cn(
              "overflow-hidden rounded-[var(--radius-xl)] border transition-colors",
              isOpen
                ? "border-accent/50 bg-card"
                : "border-border/70 bg-card/50 hover:border-accent/40",
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-[0.95rem] font-medium text-foreground">
                {item.q}
              </span>
              <Plus
                className={cn(
                  "size-4 shrink-0 text-accent transition-transform duration-300",
                  isOpen && "rotate-45",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
