"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GitPullRequest } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function PullRequestsOverviewPage() {
  const trpc = useTRPC();
  const { data: prs, isLoading } = useQuery(trpc.pullRequest.listForWorkspace.queryOptions());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pull requests</h1>
        <p className="text-sm text-muted-foreground">Every PR tracked across this workspace&apos;s linked repositories.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && prs?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <GitPullRequest className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No pull requests yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {prs?.map((pr) => (
          <Card key={pr.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  #{pr.number} {pr.title}
                  <a href={pr.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="size-3.5" />
                  </a>
                </span>
                <span className="font-data text-xs text-muted-foreground">{pr.repositoryFullName}</span>
              </div>
              <Badge variant={pr.state === "merged" ? "success" : pr.state === "closed" ? "outline" : "default"}>
                {pr.state}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
