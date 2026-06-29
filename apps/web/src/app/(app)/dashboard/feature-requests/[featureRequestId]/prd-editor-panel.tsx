"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X, CheckCircle2 } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

type Prd = {
  problemStatement: string;
  goals: string[];
  nonGoals: string[];
  userStories: { id: string; asA: string; iWant: string; soThat: string }[];
  acceptanceCriteria: { id: string; description: string }[];
  edgeCases: string[];
  successMetrics: { id: string; metric: string; target: string }[];
  approvedAt: string | Date | null;
};

function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={v}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((x, idx) => (idx === i ? e.target.value : x)))}
          />
          <Button variant="ghost" size="icon" onClick={() => onChange(values.filter((_, idx) => idx !== i))}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-fit" onClick={() => onChange([...values, ""])}>
        <Plus className="size-3.5" /> Add
      </Button>
    </div>
  );
}

export function PrdEditorPanel({ featureRequestId, initialPrd }: { featureRequestId: string; initialPrd: Prd }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [prd, setPrd] = useState(initialPrd);

  useEffect(() => setPrd(initialPrd), [initialPrd]);

  const update = useMutation(
    trpc.prd.update.mutationOptions({
      onSuccess: () => toast.success("PRD saved"),
      onError: (err) => toast.error(err.message),
    }),
  );

  const approve = useMutation(
    trpc.prd.approve.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.featureRequest.get.queryKey({ featureRequestId }),
        });
        toast.success("PRD approved — generating engineering tasks");
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const isApproved = Boolean(prd.approvedAt);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Product Requirements Document</CardTitle>
            <CardDescription>AI-generated, human-editable. Approve to move into planning.</CardDescription>
          </div>
          {isApproved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" /> Approved
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label>Problem statement</Label>
          <Textarea
            rows={3}
            value={prd.problemStatement}
            onChange={(e) => setPrd({ ...prd, problemStatement: e.target.value })}
            disabled={isApproved}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <StringListEditor
            label="Goals"
            values={prd.goals}
            onChange={(goals) => setPrd({ ...prd, goals })}
            placeholder="What this should achieve"
          />
          <StringListEditor
            label="Non-goals"
            values={prd.nonGoals}
            onChange={(nonGoals) => setPrd({ ...prd, nonGoals })}
            placeholder="Explicitly out of scope"
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Label>User stories</Label>
          {prd.userStories.map((s, i) => (
            <div key={s.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-3">
              <Input
                placeholder="As a…"
                value={s.asA}
                disabled={isApproved}
                onChange={(e) =>
                  setPrd({
                    ...prd,
                    userStories: prd.userStories.map((x, idx) => (idx === i ? { ...x, asA: e.target.value } : x)),
                  })
                }
              />
              <Input
                placeholder="I want…"
                value={s.iWant}
                disabled={isApproved}
                onChange={(e) =>
                  setPrd({
                    ...prd,
                    userStories: prd.userStories.map((x, idx) => (idx === i ? { ...x, iWant: e.target.value } : x)),
                  })
                }
              />
              <Input
                placeholder="So that…"
                value={s.soThat}
                disabled={isApproved}
                onChange={(e) =>
                  setPrd({
                    ...prd,
                    userStories: prd.userStories.map((x, idx) => (idx === i ? { ...x, soThat: e.target.value } : x)),
                  })
                }
              />
            </div>
          ))}
        </div>

        <Separator />

        <StringListEditor
          label="Acceptance criteria"
          values={prd.acceptanceCriteria.map((c) => c.description)}
          onChange={(vals) =>
            setPrd({
              ...prd,
              acceptanceCriteria: vals.map((description, i) => ({
                id: prd.acceptanceCriteria[i]?.id ?? `ac_${i}`,
                description,
              })),
            })
          }
          placeholder="A specific, testable requirement"
        />

        <StringListEditor
          label="Edge cases"
          values={prd.edgeCases}
          onChange={(edgeCases) => setPrd({ ...prd, edgeCases })}
          placeholder="A condition the implementation must handle"
        />
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button
          variant="outline"
          disabled={isApproved || update.isPending}
          onClick={() => update.mutate({ featureRequestId, ...prd })}
        >
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          disabled={isApproved || approve.isPending}
          onClick={() => approve.mutate({ featureRequestId })}
        >
          {approve.isPending ? "Approving…" : "Approve PRD"}
        </Button>
      </CardFooter>
    </Card>
  );
}
