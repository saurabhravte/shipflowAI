"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "email", label: "Email" },
  { value: "ticket", label: "Support ticket" },
  { value: "call", label: "Call transcript" },
] as const;

export default function NewFeatureRequestPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const trpc = useTRPC();
  const [title, setTitle] = useState("");
  const [rawRequest, setRawRequest] = useState("");
  const [sourceChannel, setSourceChannel] = useState<(typeof SOURCE_OPTIONS)[number]["value"]>("manual");

  const createFr = useMutation(
    trpc.featureRequest.create.mutationOptions({
      onSuccess: (fr) => {
        toast.success("Request submitted — AI is reviewing it now");
        router.push(`/dashboard/feature-requests/${fr.id}`);
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New feature request</CardTitle>
          <CardDescription>
            Paste the raw request as it came in — ShipFlow&apos;s AI will ask clarifying questions if
            it needs more context, then draft a PRD.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim() || !rawRequest.trim()) return;
              createFr.mutate({ projectId, title, rawRequest, sourceChannel });
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add CSV export to reports"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Source</Label>
              <Tabs value={sourceChannel} onValueChange={(v) => setSourceChannel(v as typeof sourceChannel)}>
                <TabsList>
                  {SOURCE_OPTIONS.map((opt) => (
                    <TabsTrigger key={opt.value} value={opt.value}>
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="raw">Request</Label>
              <Textarea
                id="raw"
                rows={8}
                value={rawRequest}
                onChange={(e) => setRawRequest(e.target.value)}
                placeholder="Paste the customer email, ticket, or call notes here…"
              />
            </div>

            <Button type="submit" disabled={createFr.isPending || !title.trim() || !rawRequest.trim()}>
              {createFr.isPending ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
