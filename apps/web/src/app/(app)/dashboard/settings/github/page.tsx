"use client";

import { useQuery } from "@tanstack/react-query";
import { Github, CheckCircle2 } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function GitHubSettingsPage() {
  const trpc = useTRPC();
  const { data: installation } = useQuery(trpc.github.installation.queryOptions());
  const { data: repoData, isLoading } = useQuery(trpc.github.listInstallableRepos.queryOptions());

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GitHub integration</h1>
        <p className="text-sm text-muted-foreground">
          Connect a GitHub account or organization to track pull requests and run AI reviews.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <Github className="size-5" />
            {installation ? (
              <div>
                <p className="font-medium">{installation.accountLogin}</p>
                <p className="text-xs text-muted-foreground">{installation.accountType}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not connected</p>
            )}
          </div>
          {installation ? (
            <Badge variant="success">
              <CheckCircle2 className="size-3" /> Connected
            </Badge>
          ) : (
            <Button asChild>
              <a href="/api/github/install">Connect GitHub</a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>Link a repository to a project to start tracking its pull requests.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {repoData?.connected === false && (
            <p className="text-sm text-muted-foreground">Connect GitHub to see your repositories.</p>
          )}
          {repoData?.repos.map((r) => (
            <div key={r.githubRepoId} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="font-data text-sm">{r.fullName}</span>
              {r.projectId ? (
                <Badge variant="outline">Linked</Badge>
              ) : (
                <Badge variant="secondary">Not linked</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
