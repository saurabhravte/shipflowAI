import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    tagline: "For solo devs kicking the tires.",
    price: 0,
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
    price: 599,
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
    name: "Business",
    tagline: "For orgs with scale & compliance needs.",
    price: 1599,
    cta: "Start Business",
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
  return (
    <div className="grid w-full max-w-5xl mx-auto gap-5 md:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "card-hover relative flex flex-col gap-6 rounded-[var(--radius-2xl)] border p-6",
            plan.featured
              ? "border-foreground/20 bg-card shadow-xl"
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
            <span className="font-display text-4xl font-bold tracking-tight text-foreground">
              ₹{plan.price.toLocaleString("en-IN")}
            </span>
            <span className="mb-1.5 text-sm text-muted-foreground">
              / month
            </span>
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
      ))}
    </div>
  );
}
