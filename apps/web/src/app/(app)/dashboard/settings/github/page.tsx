"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, CheckCircle2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useState } from "react";

type InstallableRepo = {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  projectId: string | null;
};

export default function GitHubSettingsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: installation } = useQuery(trpc.github.installation.queryOptions());
  const { data: repoData, isLoading } = useQuery(
    trpc.github.listInstallableRepos.queryOptions(),
  );
  const { data: projects } = useQuery(trpc.project.list.queryOptions());
  const [projectByRepo, setProjectByRepo] = useState<Record<number, string>>({});

  const linkRepo = useMutation(
    trpc.github.linkRepository.mutationOptions({
      onSuccess: () => {
        toast.success("Repository linked to project");
        qc.invalidateQueries({ queryKey: trpc.github.listInstallableRepos.queryKey() });
        qc.invalidateQueries({ queryKey: trpc.github.listLinkedRepos.queryKey() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  function onLink(repo: InstallableRepo) {
    const projectId = projectByRepo[repo.githubRepoId] ?? projects?.[0]?.id;
    if (!projectId) {
      toast.error("Create a project first");
      return;
    }
    linkRepo.mutate({
      githubRepoId: repo.githubRepoId,
      owner: repo.owner,
      name: repo.name,
      fullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
      isPrivate: repo.isPrivate,
      projectId,
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardContent className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            {installation ? (
              <UserAvatar
                name={installation.accountLogin}
                imageUrl={installation.avatarUrl}
                size="lg"
              />
            ) : (
              <Github className="size-10 text-muted-foreground" />
            )}
            {installation ? (
              <div>
                <p className="font-medium">{installation.accountLogin}</p>
                <p className="text-xs text-muted-foreground">
                  {installation.accountType}
                </p>
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
          <CardDescription>
            Link each repository to a project. Pull requests with{" "}
            <code className="font-data rounded bg-muted px-1 text-xs">
              ShipFlow: fr_xxx
            </code>{" "}
            in the title attach to feature requests automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading repositories…</p>
          )}
          {repoData?.connected === false && (
            <p className="text-sm text-muted-foreground">
              Connect GitHub to see your repositories.
            </p>
          )}
          {!projects?.length && repoData?.connected && (
            <p className="text-sm text-warning">
              Create a project before linking repositories.
            </p>
          )}
          {repoData?.repos.map((r) => (
            <GlowingEffect key={r.githubRepoId} className="rounded-lg">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    name={r.owner}
                    imageUrl={`https://github.com/${r.owner}.png`}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-data text-sm font-medium">
                      {r.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.defaultBranch}
                      {r.isPrivate ? " · private" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.projectId ? (
                    <Badge variant="success">Linked</Badge>
                  ) : (
                    <>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={projectByRepo[r.githubRepoId] ?? projects?.[0]?.id ?? ""}
                        onChange={(e) =>
                          setProjectByRepo((prev) => ({
                            ...prev,
                            [r.githubRepoId]: e.target.value,
                          }))
                        }
                      >
                        {projects?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={linkRepo.isPending || !projects?.length}
                        onClick={() => onLink(r)}
                      >
                        <Link2 className="size-4" />
                        Link
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </GlowingEffect>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
