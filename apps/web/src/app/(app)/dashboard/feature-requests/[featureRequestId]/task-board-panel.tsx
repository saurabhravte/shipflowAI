"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "in_review", label: "In review" },
  { key: "done", label: "Done" },
] as const;

const PRIORITY_VARIANT = {
  low: "outline",
  medium: "secondary",
  high: "warning",
  urgent: "destructive",
} as const;

export function TaskBoardPanel({
  featureRequestId,
  canApprovePlan,
}: {
  featureRequestId: string;
  canApprovePlan: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useQuery(
    trpc.task.list.queryOptions({ featureRequestId }),
  );

  const move = useMutation(
    trpc.task.move.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.task.list.queryKey({ featureRequestId }),
        }),
      onError: (err) => toast.error(err.message),
    }),
  );

  const approvePlan = useMutation(
    trpc.task.approvePlan.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.featureRequest.get.queryKey({ featureRequestId }),
        });
        toast.success("Plan approved — ready for development");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  function nextStatus(current: (typeof COLUMNS)[number]["key"]) {
    const idx = COLUMNS.findIndex((c) => c.key === current);
    return COLUMNS[Math.min(idx + 1, COLUMNS.length - 1)]!.key;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Engineering tasks</CardTitle>
            <CardDescription>
              AI-generated breakdown of the approved PRD.
            </CardDescription>
          </div>
          {canApprovePlan && (
            <Button
              onClick={() => approvePlan.mutate({ featureRequestId })}
              disabled={approvePlan.isPending}
            >
              {approvePlan.isPending ? "Approving…" : "Approve plan"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {col.label}
                </span>
                <span className="font-data text-xs text-muted-foreground">
                  {tasks?.filter((t) => t.status === col.key).length ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {tasks
                  ?.filter((t) => t.status === col.key)
                  .map((t) => (
                    <Card key={t.id} className="gap-2 p-3">
                      <p className="text-sm font-medium leading-tight">
                        {t.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant={PRIORITY_VARIANT[t.priority]}>
                          {t.priority}
                        </Badge>
                        {col.key !== "done" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() =>
                              move.mutate({
                                taskId: t.id,
                                status: nextStatus(col.key),
                                position: t.position,
                              })
                            }
                          >
                            <ArrowRight className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
