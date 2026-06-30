"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, ShieldAlert, ShieldCheck, Check, X } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { ShipFlowTagHelper } from "@/components/shipflow-tag-helper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function PullRequestPanel({
  featureRequestId,
  repository,
  featureTitle,
}: {
  featureRequestId: string;
  repository?: { fullName: string; defaultBranch: string } | null;
  featureTitle?: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: pullRequests, isLoading } = useQuery(
    trpc.pullRequest.listForFeatureRequest.queryOptions({ featureRequestId }),
  );

  const resolveFinding = useMutation(
    trpc.review.resolveFinding.mutationOptions({
      onError: (err) => toast.error(err.message),
    }),
  );

  if (isLoading)
    return (
      <p className="text-sm text-muted-foreground">Loading pull requests…</p>
    );

  if (!pullRequests || pullRequests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-4 py-6">
          <ShipFlowTagHelper
            featureRequestId={featureRequestId}
            featureTitle={featureTitle}
            repository={repository}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pullRequests.map((pr) => (
        <PullRequestCard
          key={pr.id}
          pullRequestId={pr.id}
          title={pr.title}
          number={pr.number}
          url={pr.url}
          state={pr.state}
          onResolve={(findingId: string, status: "resolved" | "dismissed") => {
            resolveFinding.mutate(
              { findingId, status },
              {
                onSuccess: () =>
                  queryClient.invalidateQueries({
                    queryKey: trpc.review.listRunsForPullRequest.queryKey({
                      pullRequestId: pr.id,
                    }),
                  }),
              },
            );
          }}
        />
      ))}
    </div>
  );
}

function PullRequestCard({
  pullRequestId,
  title,
  number,
  url,
  state,
  onResolve,
}: {
  pullRequestId: string;
  title: string;
  number: number;
  url: string;
  state: string;
  onResolve: (findingId: string, status: "resolved" | "dismissed") => void;
}) {
  const trpc = useTRPC();
  const { data: runs } = useQuery(
    trpc.review.listRunsForPullRequest.queryOptions({ pullRequestId }),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              #{number} {title}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </CardTitle>
            <CardDescription>{runs?.length ?? 0} review run(s)</CardDescription>
          </div>
          <Badge
            variant={
              state === "merged"
                ? "default"
                : state === "closed"
                  ? "outline"
                  : "secondary"
            }
          >
            {state}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {runs?.map((run, i) => (
          <div key={run.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {run.findings.some(
                (f) => f.severity === "blocking" && f.status === "open",
              ) ? (
                <ShieldAlert className="size-4 text-destructive" />
              ) : (
                <ShieldCheck className="size-4 text-success" />
              )}
              <span className="text-sm font-medium">
                Review run {runs.length - i} · {run.status}
              </span>
              <span className="font-data text-xs text-muted-foreground">
                {run.triggeredBySha.slice(0, 7)}
              </span>
            </div>
            {run.summary && (
              <p className="pl-6 text-sm text-muted-foreground">
                {run.summary}
              </p>
            )}
            <div className="flex flex-col gap-2 pl-6">
              {run.findings.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          f.severity === "blocking"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {f.severity === "blocking" ? "Blocking" : "Suggestion"}
                      </Badge>
                      <Badge variant="outline">
                        {f.category.replace("_", " ")}
                      </Badge>
                      {f.status !== "open" && (
                        <Badge variant="outline">{f.status}</Badge>
                      )}
                    </div>
                    <p className="text-sm">{f.message}</p>
                    {f.filePath && (
                      <span className="font-data text-xs text-muted-foreground">
                        {f.filePath}
                        {f.startLine ? `:${f.startLine}` : ""}
                      </span>
                    )}
                  </div>
                  {f.status === "open" && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onResolve(f.id, "resolved")}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onResolve(f.id, "dismissed")}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {i < (runs.length ?? 0) - 1 && <Separator className="mt-2" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
