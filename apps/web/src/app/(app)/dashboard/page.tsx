"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  FolderKanban,
  GitPullRequest,
  MessageSquarePlus,
  ArrowRight,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = new Set([
  "clarifying",
  "prd_generating",
  "prd_review",
  "tasks_generating",
  "tasks_review",
  "in_development",
  "ai_reviewing",
  "fix_needed",
  "human_approval",
]);

export default function DashboardOverviewPage() {
  const trpc = useTRPC();
  const { data: projects, isLoading: projectsLoading } = useQuery(
    trpc.project.list.queryOptions(),
  );
  const { data: requests, isLoading: requestsLoading } = useQuery(
    trpc.featureRequest.list.queryOptions({}),
  );
  const { data: prs, isLoading: prsLoading } = useQuery(
    trpc.pullRequest.listForWorkspace.queryOptions(),
  );
  const { data: billing } = useQuery(trpc.billing.current.queryOptions());

  const activeRequests =
    requests?.filter((r) => ACTIVE_STATUSES.has(r.status)).length ?? 0;
  const openPrs = prs?.filter((p) => p.state === "open").length ?? 0;
  const recentRequests = requests?.slice(0, 5) ?? [];

  const stats = [
    {
      label: "Projects",
      value: projects?.length ?? 0,
      sub: "Linked to repos",
      icon: FolderKanban,
      href: "/dashboard/projects",
    },
    {
      label: "Active requests",
      value: activeRequests,
      sub: "In the pipeline",
      icon: MessageSquarePlus,
      href: "/dashboard/requests",
    },
    {
      label: "Open PRs",
      value: openPrs,
      sub: "Awaiting review",
      icon: GitPullRequest,
      href: "/dashboard/pull-requests",
    },
    {
      label: "Reviews today",
      value: billing?.usage.aiReviewsUsedToday ?? 0,
      sub:
        billing?.plan === "free"
          ? `${billing.limits.aiReviewsPerDay} / day cap`
          : "Unlimited",
      icon: ShieldCheck,
      href: "/dashboard/settings/billing",
    },
  ];

  const loading = projectsLoading || requestsLoading || prsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-data text-xs uppercase tracking-widest text-accent">
            Workspace
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Review instantly.
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Your delivery pipeline — from feature request to merged PR with AI
            review and human approval.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/settings/github">Connect GitHub</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus /> New project
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <GlowingEffect className="h-full rounded-xl">
                <div className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Icon className="size-4" />
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold tabular-nums">
                      {loading ? "—" : s.value}
                    </p>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                </div>
              </GlowingEffect>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlowingEffect className="rounded-xl">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                Recent requests
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/requests">View all</Link>
              </Button>
            </div>
            {loading && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!loading && recentRequests.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Rocket className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No feature requests yet. Create a project and drop in your
                  first request.
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard/projects/new">Create project</Link>
                </Button>
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {recentRequests.map((fr) => (
                <li key={fr.id}>
                  <Link
                    href={`/dashboard/feature-requests/${fr.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/60 hover:bg-muted/40"
                  >
                    <span className="truncate text-sm font-medium">
                      {fr.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] capitalize"
                    >
                      {fr.status.replace(/_/g, " ")}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </GlowingEffect>

        <GlowingEffect className="rounded-xl">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                Pull requests
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/pull-requests">View all</Link>
              </Button>
            </div>
            {!prsLoading && (!prs || prs.length === 0) && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Open a PR with{" "}
                <code className="font-data rounded bg-muted px-1.5 py-0.5 text-xs">
                  ShipFlow: fr_xxx
                </code>{" "}
                in the title to link it here.
              </p>
            )}
            <ul className="flex flex-col gap-2">
              {prs?.slice(0, 5).map((pr) => (
                <li key={pr.id}>
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <span className="truncate text-sm">
                      <span className="font-data text-muted-foreground">
                        #{pr.number}
                      </span>{" "}
                      {pr.title}
                    </span>
                    <Badge
                      variant={pr.state === "open" ? "brand" : "outline"}
                      className="shrink-0 text-[10px] capitalize"
                    >
                      {pr.state}
                    </Badge>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </GlowingEffect>
      </div>

      {!projectsLoading && projects && projects.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Projects</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/projects">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                <GlowingEffect className={cn("h-full rounded-xl")}>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-semibold">{p.name}</p>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.description || "No description"}
                    </p>
                  </div>
                </GlowingEffect>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
