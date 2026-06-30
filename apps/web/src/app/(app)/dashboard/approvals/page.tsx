"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  GitPullRequest,
  Rocket,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { UserAvatar } from "@/components/user-avatar";

const GATE_META = {
  prd: {
    label: "PRD approval",
    icon: FileText,
    action: "Review & approve PRD",
  },
  tasks: {
    label: "Task plan approval",
    icon: ClipboardList,
    action: "Approve engineering plan",
  },
  release: {
    label: "Release approval",
    icon: Rocket,
    action: "Final ship decision",
  },
} as const;

export default function ApprovalsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: pending, isLoading } = useQuery(
    trpc.approval.listPending.queryOptions(),
  );
  const { data: linkedRepos } = useQuery(
    trpc.github.listLinkedRepos.queryOptions(),
  );
  const { data: installation } = useQuery(
    trpc.github.installation.queryOptions(),
  );

  const approvePrd = useMutation(
    trpc.prd.approve.mutationOptions({
      onSuccess: () => {
        toast.success("PRD approved — generating tasks");
        qc.invalidateQueries({ queryKey: trpc.approval.listPending.queryKey() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const approvePlan = useMutation(
    trpc.task.approvePlan.mutationOptions({
      onSuccess: () => {
        toast.success("Plan approved — ready for development");
        qc.invalidateQueries({ queryKey: trpc.approval.listPending.queryKey() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-data text-xs uppercase tracking-widest text-accent">
          Human gates
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Approvals
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          PRD, task plan, and release decisions — with linked repos and pull
          requests in one place. Nothing ships without your sign-off.
        </p>
      </div>

      {installation && (
        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/40 px-4 py-3">
          <UserAvatar
            name={installation.accountLogin}
            imageUrl={installation.avatarUrl}
            size="md"
          />
          <div>
            <p className="text-sm font-medium">GitHub · {installation.accountLogin}</p>
            <p className="text-xs text-muted-foreground">{installation.accountType}</p>
          </div>
          <Badge variant="success" className="ml-auto">
            <CheckCircle2 className="size-3" /> Connected
          </Badge>
        </div>
      )}

      {linkedRepos && linkedRepos.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">
            Linked repositories
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {linkedRepos.map((repo) => (
              <GlowingEffect key={repo.id} className="rounded-xl">
                <div className="flex items-start gap-3 p-4">
                  <UserAvatar
                    name={repo.owner}
                    imageUrl={repo.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-data text-sm font-medium">
                      {repo.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Project: {repo.project?.name ?? "—"}
                    </p>
                    <p className="font-data text-[10px] text-muted-foreground">
                      {repo.defaultBranch}
                    </p>
                  </div>
                </div>
              </GlowingEffect>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">
          Pending approvals
          {pending && pending.length > 0 && (
            <Badge variant="brand" className="ml-2">
              {pending.length}
            </Badge>
          )}
        </h2>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading queue…</p>
        )}

        {!isLoading && pending?.length === 0 && (
          <GlowingEffect className="rounded-xl">
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">
              No tickets waiting for approval. When a feature reaches a human
              gate, it will show up here.
            </div>
          </GlowingEffect>
        )}

        <div className="flex flex-col gap-4">
          {pending?.map((item) => {
            const meta = GATE_META[item.gate];
            const Icon = meta.icon;
            return (
              <GlowingEffect key={item.id} className="rounded-xl">
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand" className="gap-1">
                        <Icon className="size-3" />
                        {meta.label}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/feature-requests/${item.id}`}
                        className="font-display text-lg font-semibold hover:text-accent"
                      >
                        {item.title}
                      </Link>
                      <p className="font-data text-xs text-muted-foreground">
                        {item.id} · {item.project.name}
                      </p>
                    </div>

                    {item.repository ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserAvatar
                          name={item.repository.fullName.split("/")[0] ?? "gh"}
                          imageUrl={`https://github.com/${item.repository.fullName.split("/")[0]}.png`}
                          size="sm"
                        />
                        <span className="font-data">{item.repository.fullName}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-warning">
                        No repo linked —{" "}
                        <Link
                          href="/dashboard/repositories"
                          className="underline"
                        >
                          link one in GitHub settings
                        </Link>
                      </p>
                    )}

                    {item.pullRequests.length > 0 && (
                      <ul className="space-y-1">
                        {item.pullRequests.map((pr) => (
                          <li key={pr.id}>
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                            >
                              <GitPullRequest className="size-3.5" />
                              #{pr.number} {pr.title}
                              <ExternalLink className="size-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {item.prdReady ? "PRD ready" : "PRD pending"} ·{" "}
                      {item.taskCount} tasks
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    {item.gate === "prd" && (
                      <Button
                        size="sm"
                        disabled={approvePrd.isPending}
                        onClick={() =>
                          approvePrd.mutate({ featureRequestId: item.id })
                        }
                      >
                        Approve PRD
                      </Button>
                    )}
                    {item.gate === "tasks" && (
                      <Button
                        size="sm"
                        disabled={approvePlan.isPending}
                        onClick={() =>
                          approvePlan.mutate({ featureRequestId: item.id })
                        }
                      >
                        Approve plan
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/feature-requests/${item.id}`}>
                        Open ticket
                      </Link>
                    </Button>
                  </div>
                </div>
              </GlowingEffect>
            );
          })}
        </div>
      </section>
    </div>
  );
}
