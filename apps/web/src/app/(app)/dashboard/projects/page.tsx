"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderKanban } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ArrowRight } from "lucide-react";

export default function ProjectsListPage() {
  const trpc = useTRPC();
  const { data: projects, isLoading } = useQuery(trpc.project.list.queryOptions());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Every feature request lives inside a project, linked to a repository.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus /> New project
          </Link>
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      )}

      {!isLoading && projects?.length === 0 && (
        <GlowingEffect className="rounded-xl">
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <FolderKanban className="size-8 text-muted-foreground" />
            <p className="font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create a project and connect a GitHub repository to start tracking
              feature requests.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/projects/new">
                <Plus /> New project
              </Link>
            </Button>
          </div>
        </GlowingEffect>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
            <GlowingEffect className="h-full rounded-xl">
              <div className="flex h-full flex-col gap-2 p-6">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {p.description || "No description"}
                </p>
              </div>
            </GlowingEffect>
          </Link>
        ))}
      </div>
    </div>
  );
}
