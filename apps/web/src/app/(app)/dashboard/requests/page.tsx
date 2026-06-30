"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, MessageSquarePlus } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export default function RequestsPage() {
  const trpc = useTRPC();
  const { data: requests, isLoading } = useQuery(
    trpc.featureRequest.list.queryOptions({}),
  );
  const { data: projects } = useQuery(trpc.project.list.queryOptions());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Feature requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Every request moves through clarify → PRD → tasks → review → ship.
          </p>
        </div>
        {projects && projects.length > 0 && (
          <Button asChild>
            <Link href={`/dashboard/projects/${projects[0]!.id}/feature-requests/new`}>
              <Plus /> New request
            </Link>
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      )}

      {!isLoading && requests?.length === 0 && (
        <GlowingEffect className="rounded-xl">
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <MessageSquarePlus className="size-8 text-muted-foreground" />
            <p className="font-medium">No requests yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create a project first, then submit a feature request to start the
              pipeline.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/projects/new">Create project</Link>
            </Button>
          </div>
        </GlowingEffect>
      )}

      <div className="grid gap-3">
        {requests?.map((fr) => (
          <Link key={fr.id} href={`/dashboard/feature-requests/${fr.id}`}>
            <GlowingEffect className="rounded-xl">
              <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{fr.title}</p>
                  <p className="font-data text-xs text-muted-foreground">
                    {fr.id}
                  </p>
                </div>
                <Badge variant="outline" className="w-fit capitalize">
                  {fr.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </GlowingEffect>
          </Link>
        ))}
      </div>
    </div>
  );
}
