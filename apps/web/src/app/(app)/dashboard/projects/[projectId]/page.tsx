"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  clarifying: "Clarifying",
  prd_generating: "Generating PRD",
  prd_review: "PRD review",
  tasks_generating: "Generating tasks",
  tasks_review: "Tasks review",
  in_development: "In development",
  ai_reviewing: "AI reviewing",
  fix_needed: "Fix needed",
  human_approval: "Awaiting approval",
  shipped: "Shipped",
  rejected: "Rejected",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  draft: "outline",
  clarifying: "secondary",
  prd_generating: "secondary",
  prd_review: "secondary",
  tasks_generating: "secondary",
  tasks_review: "secondary",
  in_development: "default",
  ai_reviewing: "default",
  fix_needed: "warning",
  human_approval: "warning",
  shipped: "success",
  rejected: "destructive",
};

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const trpc = useTRPC();
  const { data: project } = useQuery(trpc.project.get.queryOptions({ projectId }));
  const { data: featureRequests, isLoading } = useQuery(
    trpc.featureRequest.list.queryOptions({ projectId }),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project?.name ?? "…"}</h1>
          <p className="text-sm text-muted-foreground">{project?.description}</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/projects/${projectId}/feature-requests/new`}>
            <Plus /> New feature request
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {featureRequests?.map((fr) => (
          <Link key={fr.id} href={`/dashboard/feature-requests/${fr.id}`}>
            <Card className="transition-colors hover:border-accent">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{fr.title}</span>
                  <span className="font-data text-xs text-muted-foreground">{fr.id}</span>
                </div>
                <Badge variant={STATUS_VARIANT[fr.status]}>{STATUS_LABEL[fr.status]}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}

        {!isLoading && featureRequests?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No feature requests yet — create the first one to start the pipeline.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
