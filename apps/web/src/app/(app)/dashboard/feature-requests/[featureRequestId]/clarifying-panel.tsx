"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type Exchange = { id: string; question: string; answer: string | null };

export function ClarifyingQuestionsPanel({
  featureRequestId,
  exchanges,
}: {
  featureRequestId: string;
  exchanges: Exchange[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(exchanges.map((e) => [e.id, e.answer ?? ""])),
  );

  const submit = useMutation(
    trpc.featureRequest.submitClarifyingAnswers.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.featureRequest.get.queryKey({ featureRequestId }),
        });
        toast.success("Answers submitted — generating the PRD now");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const allAnswered = exchanges.every((e) => answers[e.id]?.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>A few questions before the PRD</CardTitle>
        <CardDescription>
          ShipFlow&apos;s AI needs a bit more context before it can write a solid PRD.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {exchanges.map((e, i) => (
          <div key={e.id} className="flex flex-col gap-1.5">
            <Label htmlFor={e.id}>
              {i + 1}. {e.question}
            </Label>
            <Textarea
              id={e.id}
              value={answers[e.id] ?? ""}
              onChange={(ev) => setAnswers((prev) => ({ ...prev, [e.id]: ev.target.value }))}
            />
          </div>
        ))}
        <Button
          disabled={!allAnswered || submit.isPending}
          onClick={() =>
            submit.mutate({
              featureRequestId,
              answers: exchanges.map((e) => ({ exchangeId: e.id, answer: answers[e.id] ?? "" })),
            })
          }
        >
          {submit.isPending ? "Submitting…" : "Submit answers"}
        </Button>
      </CardContent>
    </Card>
  );
}
