"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Rocket, Undo2 } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function ApprovalPanel({ featureRequestId }: { featureRequestId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const decide = useMutation(
    trpc.approval.decide.mutationOptions({
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: trpc.featureRequest.get.queryKey({ featureRequestId }),
        });
        toast.success(variables.decision === "approved" ? "Shipped 🚀" : "Sent back");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <Card className="border-accent/40">
      <CardHeader>
        <CardTitle>Final approval</CardTitle>
        <CardDescription>
          Review the PRD, tasks, pull request, and AI review history above, then decide.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Optional notes for this decision…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          disabled={decide.isPending}
          onClick={() => decide.mutate({ featureRequestId, decision: "approved", notes })}
        >
          <Rocket /> Approve & ship
        </Button>
        <Button
          variant="outline"
          disabled={decide.isPending}
          onClick={() =>
            decide.mutate({ featureRequestId, decision: "rejected", notes, sendBackForFixes: true })
          }
        >
          <Undo2 /> Send back for fixes
        </Button>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={decide.isPending}
          onClick={() => decide.mutate({ featureRequestId, decision: "rejected", notes })}
        >
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
