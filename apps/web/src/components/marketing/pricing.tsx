"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    tagline: "For solo devs kicking the tires.",
    monthly: 0,
    annually: 0,
    cta: "Get started",
    href: "/sign-up",
    featured: false,
    features: [
      "1 connected repository",
      "25 AI reviews / month",
      "Feature request → PRD → tasks",
      "Bring your own API key",
    ],
  },
  {
    name: "Pro",
    tagline: "For teams shipping every day.",
    monthly: 19,
    annually: 15,
    cta: "Start Pro",
    href: "/sign-up",
    featured: true,
    features: [
      "Unlimited repositories",
      "Unlimited AI reviews",
      "Repo-aware review context",
      "Priority pipeline runs",
      "Human-approval gates",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For orgs with scale & compliance needs.",
    monthly: null,
    annually: null,
    cta: "Contact us",
    href: "/sign-up",
    featured: false,
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Self-hosted model routing",
      "Audit logs & SLAs",
      "Dedicated support",
    ],
  },
] as const;

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/60 p-1 backdrop-blur-sm">
        <button
          onClick={() => setAnnual(false)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            !annual
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            annual
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Annually
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              annual ? "bg-accent-foreground/15" : "bg-accent/15 text-accent",
            )}
          >
            -20%
          </span>
        </button>
      </div>

      <div className="grid w-full max-w-5xl gap-5 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = annual ? plan.annually : plan.monthly;
          return (
            <div
              key={plan.name}
              className={cn(
                "card-hover relative flex flex-col gap-6 rounded-[var(--radius-2xl)] border p-6",
                plan.featured
                  ? "border-accent/60 bg-card shadow-[0_24px_80px_-40px_var(--accent)]"
                  : "border-border/70 bg-card/50",
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
                  Most popular
                </span>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              </div>

              <div className="flex items-end gap-1">
                {price === null ? (
                  <span className="font-display text-3xl font-bold text-foreground">
                    Custom
                  </span>
                ) : (
                  <>
                    <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                      ${price}
                    </span>
                    <span className="mb-1.5 text-sm text-muted-foreground">
                      / editor / mo
                    </span>
                  </>
                )}
              </div>

              <Button
                asChild
                variant={plan.featured ? "default" : "outline"}
                className="w-full"
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>

              <ul className="flex flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Check className="size-3" />
                    </span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
