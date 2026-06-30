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

  const repos = useMemo(() => {
    const list = (repoData?.repos ?? []) as InstallableRepo[];
    return [...list].sort((a, b) => {
      const aTime = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
      const bTime = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [repoData?.repos]);

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
          <div className="flex flex-wrap items-center gap-3">
            {installation ? (
              <>
                <Badge variant="success" className="px-3 py-1 text-sm">
                  <CheckCircle2 className="size-4" /> Connected
                </Badge>
                <Button
                  variant="outline"
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
        <CardContent>
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
          {repos.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              {repos.map((r, index) => (
                <div
                  key={r.githubRepoId}
                  className={cn(
                    "flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center lg:gap-4",
                    index !== 0 && "border-t",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar
                      name={r.owner}
                      imageUrl={`https://github.com/${r.owner}.png`}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={r.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex items-center gap-1.5 truncate text-sm font-semibold transition-colors hover:text-accent"
                        >
                          {r.name}
                          <ExternalLink className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                        </a>
                        {r.projectId ? (
                          <Badge variant="success">Linked</Badge>
                        ) : null}
                      </div>
                      <p className="truncate font-data text-xs text-muted-foreground">
                        {r.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground lg:w-auto lg:justify-end">
                    <Badge variant={r.isPrivate ? "warning" : "secondary"}>
                      {r.isPrivate ? (
                        <>
                          <Lock className="size-3" /> Private
                        </>
                      ) : (
                        <>
                          <Globe className="size-3" /> Public
                        </>
                      )}
                    </Badge>
                    <span className="inline-flex w-20 items-center gap-1.5 truncate">
                      <GitBranch className="size-3 shrink-0" />
                      {r.defaultBranch}
                    </span>
                    <span className="inline-flex w-28 items-center gap-1.5">
                      {r.language ? (
                        <>
                          <span className="size-2 shrink-0 rounded-full bg-accent" />
                          {r.language}
                        </>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </span>
                    <span className="inline-flex w-12 items-center gap-1">
                      <Star className="size-3 shrink-0" />
                      {r.stars.toLocaleString()}
                    </span>
                    <span className="inline-flex w-20 items-center gap-1 tabular-nums">
                      <Clock className="size-3 shrink-0" />
                      {formatRelativeTime(r.pushedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 lg:shrink-0">
                    {!r.projectId && (
                      <>
                        {(projects?.length ?? 0) > 1 && (
                          <select
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            value={
                              projectByRepo[r.githubRepoId] ??
                              projects?.[0]?.id ??
                              ""
                            }
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
                        )}
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
                      Sync
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
