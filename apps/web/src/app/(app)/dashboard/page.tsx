"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DashboardOverviewPage() {
  const trpc = useTRPC();
  const { data: projects, isLoading } = useQuery(trpc.project.list.queryOptions());

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Every feature request starts inside a project, linked to a repository.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus /> New project
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading projects…</p>}

      {!isLoading && projects?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FolderKanban className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No projects yet</p>
              <p className="text-sm text-muted-foreground">
                Create a project, then connect a GitHub repository to start tracking feature
                requests.
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link href="/dashboard/projects/new">
                <Plus /> New project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
            <Card className="h-full transition-colors hover:border-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                <CardDescription>{p.description || "No description"}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
