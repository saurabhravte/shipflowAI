"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Github,
  CheckCircle2,
  Link2,
  ExternalLink,
  RefreshCw,
  Star,
  Lock,
  Globe,
  GitBranch,
  Clock,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

type InstallableRepo = {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  language: string | null;
  stars: number;
  htmlUrl: string;
  pushedAt: string | null;
  projectId: string | null;
};

function formatRelativeTime(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function RepositoriesPanel({ className }: { className?: string }) {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const installationQuery = useMemo(
    () => trpc.github.installation.queryOptions(),
    [trpc],
  );
  const reposQuery = useMemo(
    () => trpc.github.listInstallableRepos.queryOptions(),
    [trpc],
  );
  const projectsQuery = useMemo(
    () => trpc.project.list.queryOptions(),
    [trpc],
  );

  const { data: installation } = useQuery({
    ...installationQuery,
    staleTime: 60_000,
  });
  const {
    data: repoData,
    isLoading,
    isFetching,
    refetch: refetchRepos,
  } = useQuery({
    ...reposQuery,
    staleTime: 60_000,
    enabled: !!installation,
  });
  const { data: projects } = useQuery({
    ...projectsQuery,
    staleTime: 60_000,
  });

  const [projectByRepo, setProjectByRepo] = useState<Record<number, string>>({});

  const invalidateRepos = useCallback(() => {
    qc.invalidateQueries({ queryKey: trpc.github.listInstallableRepos.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.github.listLinkedRepos.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.github.installation.queryKey() });
  }, [qc, trpc]);

  const linkRepo = useMutation(
    trpc.github.linkRepository.mutationOptions({
      onSuccess: () => {
        toast.success("Repository linked to project");
        invalidateRepos();
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const handleResync = useCallback(async () => {
    try {
      await refetchRepos();
      toast.success("Repositories synced from GitHub");
    } catch {
      toast.error("Failed to sync repositories");
    }
  }, [refetchRepos]);

  const onLink = useCallback(
    (repo: InstallableRepo) => {
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
    },
    [linkRepo, projectByRepo, projects],
  );

  const repos = useMemo(
    () => (repoData?.repos ?? []) as InstallableRepo[],
    [repoData?.repos],
  );

  return (
    <div className={cn("flex w-full flex-col gap-6", className)}>
      <Card>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
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
            <div>
              {installation ? (
                <>
                  <p className="font-medium">{installation.accountLogin}</p>
                  <p className="text-xs text-muted-foreground">
                    {installation.accountType}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Connect GitHub to manage repositories
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {installation ? (
              <>
                <Badge variant="success">
                  <CheckCircle2 className="size-3" /> Connected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResync}
                  disabled={isFetching}
                >
                  <RefreshCw
                    className={cn("size-4", isFetching && "animate-spin")}
                  />
                  Resync
                </Button>
              </>
            ) : (
              <Button asChild>
                <a href="/api/github/install">Connect GitHub</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Repositories</CardTitle>
            <CardDescription>
              Link repositories to projects. Pull requests with{" "}
              <code className="font-data rounded bg-muted px-1 text-xs">
                ShipFlow: fr_xxx
              </code>{" "}
              in the title attach to feature requests automatically.
            </CardDescription>
          </div>
          {installation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResync}
              disabled={isFetching}
              className="shrink-0"
            >
              <RefreshCw
                className={cn("size-4", isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading repositories…</p>
          )}
          {!installation && !isLoading && (
            <p className="text-sm text-muted-foreground">
              Connect GitHub to see your repositories.
            </p>
          )}
          {installation && !projects?.length && !isLoading && (
            <p className="text-sm text-warning">
              Create a project before linking repositories.
            </p>
          )}
          {repos.map((r) => (
            <GlowingEffect key={r.githubRepoId} className="rounded-lg">
              <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <UserAvatar
                    name={r.owner}
                    imageUrl={`https://github.com/${r.owner}.png`}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={r.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-1.5 truncate font-data text-sm font-medium transition-colors hover:text-accent"
                      >
                        {r.fullName}
                        <ExternalLink className="size-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
                      </a>
                      {r.projectId ? (
                        <Badge variant="success">Linked</Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <GitBranch className="size-3" />
                        {r.defaultBranch}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {r.isPrivate ? (
                          <>
                            <Lock className="size-3" /> Private
                          </>
                        ) : (
                          <>
                            <Globe className="size-3" /> Public
                          </>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3" />
                        {r.stars.toLocaleString()}
                      </span>
                      {r.language && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-accent" />
                          {r.language}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatRelativeTime(r.pushedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                  {!r.projectId && (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResync}
                    disabled={isFetching}
                  >
                    <RefreshCw
                      className={cn("size-3.5", isFetching && "animate-spin")}
                    />
                    Resync
                  </Button>
                </div>
              </div>
            </GlowingEffect>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
