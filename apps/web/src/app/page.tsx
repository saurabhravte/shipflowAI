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
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PipelineFlow } from "@/components/marketing/pipeline-flow";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground font-sans">
      <SiteHeader />

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
        <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[34rem] w-[60rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl aurora-bg" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 lg:px-8 lg:pt-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Link
              href="/docs"
              className="group mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-accent/60 hover:text-foreground"
            >
              <Badge variant="brand" className="px-2 py-0">New</Badge>
              Repo-aware AI review, now with your own API key
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <h1 className="font-display text-6xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              Ship <span className="text-gradient-brand">reviewed.</span>
            </h1>

            <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              ShipFlow AI turns a raw feature request into a reviewed, merged
              pull request — with AI doing the review and humans doing the
              deciding.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start shipping <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/docs">Read the docs</Link>
              </Button>
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

      {/* ───────────────────────── Trust strip ───────────────────────── */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-6 text-sm text-muted-foreground lg:px-8">
          <span className="font-data text-xs uppercase tracking-widest">
            A better alternative to
          </span>
          {["CodeRabbit", "Qodo Merge", "Greptile", "Korbit"].map((n) => (
            <span key={n} className="font-display font-semibold text-foreground/80">
              {n}
            </span>
          ))}
        </div>
      </section>

      {/* ───────────────────────── Features ───────────────────────── */}
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
            <p className="mt-4 text-muted-foreground">
              Most tools review a PR after it exists. ShipFlow owns the whole
              path — and reviews it smarter when it gets there.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="card-hover group relative flex flex-col gap-4 rounded-[var(--radius-2xl)] border border-border/70 bg-card/50 p-6"
                >
                  <span className="flex size-11 items-center justify-center rounded-[0.7rem] bg-accent/10 text-accent ring-1 ring-accent/20 transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section id="how" className="relative scroll-mt-20 border-y border-border/60 bg-card/20 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="brand" className="mb-4">
              <Workflow className="size-3" /> How it works
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              One loop, fully{" "}
              <span className="text-gradient-brand">observable</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
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
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* AI review mock card */}
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
                  <p className="text-muted-foreground pl-4">
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

      {/* ───────────────────────── Comparison ───────────────────────── */}
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
                    <span className="font-data text-xs text-warning">partial</span>
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

      {/* ───────────────────────── BYOK band ───────────────────────── */}
      <section className="px-5 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[var(--radius-2xl)] border border-accent/30 bg-card/40 p-8 sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-dot opacity-40" />
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <Badge variant="brand" className="mb-4">
                <KeyRound className="size-3" /> Bring your own key
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Your models. Your spend. Your data.
              </h2>
              <p className="mt-3 text-muted-foreground">
                ShipFlow is model-agnostic. Add your own API key, pick a fast
                model for drafting and a strong one for review, and keep every
                request inside your own provider boundary.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/docs/bring-your-own-key">
                Set up your key <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Pricing ───────────────────────── */}
      <section id="pricing" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="brand" className="mb-4">
              Pricing
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, <span className="text-gradient-brand">honest</span> pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free. Bring your own key on any plan. Upgrade when your team
              ships more.
            </p>
          </div>
          <Pricing />
        </div>
      </section>

      {/* ───────────────────────── FAQ ───────────────────────── */}
      <section id="faq" className="scroll-mt-20 border-t border-border/60 bg-card/20 py-24">
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

      {/* ───────────────────────── Final CTA ───────────────────────── */}
      <section className="relative overflow-hidden px-5 py-24 lg:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl aurora-bg" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Ready to <span className="text-gradient-brand">ship reviewed?</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Connect a repo, bring your key, and let AI handle the busywork
            between request and merge.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Get started free <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs/setup">Quick setup guide</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
