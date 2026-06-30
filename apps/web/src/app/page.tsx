import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  GitPullRequest,
  Sparkles,
  KeyRound,
  Workflow,
  Brain,
  GitMerge,
  Check,
  X,
  FileText,
  Zap,
  Github,
} from "lucide-react";
import { getServerSession } from "@/server/auth/session";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PipelineFlow } from "@/components/marketing/pipeline-flow";
import { DeliveryLoop } from "@/components/marketing/delivery-loop";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { Badge } from "@/components/ui/badge";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { HexagonPattern } from "@/components/ui/hexagon-pattern";

const FEATURES = [
  {
    icon: Brain,
    title: "Repo-aware reviews",
    body: "Every review reasons over the diff and the surrounding codebase — not just the lines that changed — so it catches the bugs other tools miss.",
  },
  {
    icon: Workflow,
    title: "Request → merged PR",
    body: "A raw feature request becomes a PRD, a task breakdown, code, and a reviewed pull request. The whole pipeline, in one place.",
  },
  {
    icon: KeyRound,
    title: "Bring your own key",
    body: "Model-agnostic via OpenRouter. Plug in your own API key, choose your models, and keep full control of spend and data.",
  },
  {
    icon: ShieldCheck,
    title: "Human-approval gates",
    body: "AI does the review, humans do the deciding. Nothing ships until a real person signs off at the approval gate.",
  },
  {
    icon: Zap,
    title: "Durable background runs",
    body: "Workflows are powered by durable execution — a flaky model call retries the step, never the whole pipeline.",
  },
  {
    icon: FileText,
    title: "Living PRDs & tasks",
    body: "Editable, AI-drafted product specs and task boards stay in sync with the work as it moves toward production.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Drop in the request",
    body: "Paste a customer email, a ticket, or a one-liner. ShipFlow asks clarifying questions when it needs more context.",
  },
  {
    n: "02",
    title: "AI drafts the plan",
    body: "A structured PRD and a task breakdown are generated automatically — fully editable before anything is built.",
  },
  {
    n: "03",
    title: "Review with full context",
    body: "When the PR opens, ShipFlow reviews it against the whole repo, flags real issues, and suggests concrete fixes.",
  },
  {
    n: "04",
    title: "Approve & ship",
    body: "A human signs off at the approval gate. ShipFlow routes it to merge and marks the request shipped.",
  },
];

const COMPARE = [
  { label: "Repo-aware review context", us: true, them: "partial" },
  { label: "Request → PRD → tasks pipeline", us: true, them: false },
  { label: "Bring your own model key", us: true, them: "partial" },
  { label: "Human-approval gates", us: true, them: false },
  { label: "Durable background workflows", us: true, them: false },
];

export default async function LandingPage() {
  const authSession = await getServerSession();
  if (authSession) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <HexagonPattern
          className="[mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000_55%,transparent_100%)]"
          radius={28}
          gap={6}
        />
        <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[34rem] w-[60rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl aurora-bg" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 lg:px-8 lg:pt-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Link
              href="/docs"
              className="group mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-accent/60 hover:text-foreground"
            >
              <Badge variant="brand" className="px-2 py-0">
                New
              </Badge>
              Repo-aware AI review, now with your own API key
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <p className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Review <span className="text-gradient-brand">instantly</span>
            </p>

            <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
              From raw request to merged PR — AI reviews the code, humans
              approve the release.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/sign-up"
                className="font-medium text-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                Create an account
              </Link>
              <span className="text-muted-foreground/50" aria-hidden>
                ·
              </span>
              <Link
                href="/docs"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Read the docs
              </Link>
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <Github className="size-3.5" />
              Open source · Bring your own key
            </p>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl animate-[rise_0.7s_ease-out_both]">
            <PipelineFlow />
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-6 text-sm text-muted-foreground lg:px-8">
          <span className="font-data text-xs uppercase tracking-widest">
            An alternative to
          </span>
          {["CodeRabbit", "Qodo Merge", "Greptile", "Korbit"].map((n) => (
            <span
              key={n}
              className="font-display font-semibold text-foreground/80"
            >
              {n}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="relative scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="brand" className="mb-4">
              <Sparkles className="size-3" /> Features
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Everything between{" "}
              <span className="text-gradient-brand">idea and merge</span>
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Most tools review a PR after it exists. ShipFlow owns the whole
              path — and reviews it smarter when it gets there.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <GlowingEffect
                  key={f.title}
                  className="rounded-[var(--radius-2xl)]"
                >
                  <div className="flex flex-col gap-4 p-6">
                    <span className="flex size-11 items-center justify-center rounded-[0.7rem] bg-accent/10 text-accent ring-1 ring-accent/20 transition-colors group-hover/glow:bg-accent group-hover/glow:text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </GlowingEffect>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="loop"
        className="relative scroll-mt-24 border-y border-border/60 bg-card/20 py-24"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="brand" className="mb-4">
              <Workflow className="size-3" /> Core loop
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Request to production —{" "}
              <span className="text-gradient-brand">one pipeline</span>
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Five phases. One observable loop. Click a phase or watch it cycle.
            </p>
          </div>
          <div className="mt-14">
            <DeliveryLoop />
          </div>
        </div>
      </section>

      <section id="how" className="relative scroll-mt-24 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="brand" className="mb-4">
              <Workflow className="size-3" /> How it works
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              One loop, fully{" "}
              <span className="text-gradient-brand">observable</span>
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              From the first message to the merge button — here is the journey
              every feature request takes.
            </p>
          </div>

          <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
            <ol className="flex flex-col gap-4">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="card-hover flex gap-4 rounded-[var(--radius-xl)] border border-border/70 bg-card/60 p-5"
                >
                  <span className="font-data text-sm font-semibold text-accent">
                    {s.n}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-base font-semibold">
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-30 blur-2xl aurora-bg" />
              <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border/70 bg-background/80 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="size-4 text-accent" />
                    <span className="font-data text-xs text-muted-foreground">
                      #128 · feat: csv export
                    </span>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    AI reviewed
                  </Badge>
                </div>
                <div className="space-y-3 p-4 font-data text-xs">
                  <p className="text-muted-foreground">
                    <span className="text-success">+ </span>
                    export function toCsv(rows: Row[]) &#123;
                  </p>
                  <p className="pl-4 text-muted-foreground">
                    <span className="text-destructive">- </span>
                    return rows.map(r =&gt; r.join(&quot;,&quot;))
                  </p>
                  <div className="rounded-[0.7rem] border border-accent/30 bg-accent/10 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 font-sans text-[11px] font-semibold text-accent">
                      <Brain className="size-3.5" /> ShipFlow review
                    </div>
                    <p className="font-sans leading-relaxed text-foreground/90">
                      Values containing commas or quotes will break the output.
                      Escape fields and wrap in quotes before joining.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="flex items-center gap-1 text-success">
                      <Check className="size-3.5" /> Fix accepted
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <GitMerge className="size-3.5" /> Ready to merge
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="brand" className="mb-4">
              <ShieldCheck className="size-3" /> Why ShipFlow
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              More than a{" "}
              <span className="text-gradient-brand">PR commenter</span>
            </h2>
          </div>

          <div className="mt-12 overflow-hidden rounded-[var(--radius-2xl)] border border-border/70">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border/60 bg-card/60 px-5 py-4 text-sm font-semibold sm:px-8">
              <span className="text-muted-foreground">Capability</span>
              <span className="w-24 text-center font-display text-accent">
                ShipFlow
              </span>
              <span className="w-24 text-center text-muted-foreground">
                Typical tools
              </span>
            </div>
            {COMPARE.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 text-sm sm:px-8 ${
                  i % 2 ? "bg-background" : "bg-card/30"
                }`}
              >
                <span className="text-foreground/90">{row.label}</span>
                <span className="flex w-24 justify-center">
                  <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3.5" />
                  </span>
                </span>
                <span className="flex w-24 justify-center">
                  {row.them === true ? (
                    <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="size-3.5" />
                    </span>
                  ) : row.them === "partial" ? (
                    <span className="font-data text-xs text-warning">
                      partial
                    </span>
                  ) : (
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <X className="size-3.5" />
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="brand" className="mb-4">
              Pricing
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, <span className="text-gradient-brand">honest</span>{" "}
              pricing
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Start free. Bring your own key on any plan. Upgrade when your team
              ships more.
            </p>
          </div>
          <Pricing />
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-24 border-t border-border/60 bg-card/20 py-24"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="brand" className="mb-4">
              FAQ
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Questions, <span className="text-gradient-brand">answered</span>
            </h2>
          </div>
          <Faq />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
