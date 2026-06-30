"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function WorkflowErrorAlert({
  featureRequestId,
  message,
  canRetry,
}: {
  featureRequestId: string;
  message: string;
  canRetry?: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const retry = useMutation(
    trpc.featureRequest.retryPrdGeneration.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.featureRequest.get.queryKey({ featureRequestId }),
        });
        toast.success("Retrying PRD generation…");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Workflow interrupted</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              disabled={retry.isPending}
              onClick={() => retry.mutate({ featureRequestId })}
            >
              {retry.isPending ? "Retrying…" : "Retry PRD generation"}
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/settings/billing">Upgrade plan</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
