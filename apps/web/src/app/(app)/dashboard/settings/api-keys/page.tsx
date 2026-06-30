"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function ApiKeysSettingsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: status, isLoading } = useQuery(trpc.workspace.apiKeyStatus.queryOptions());
  const [apiKey, setApiKey] = useState("");

  const setKey = useMutation(
    trpc.workspace.setApiKey.mutationOptions({
      onSuccess: (res) => {
        toast.success("API key saved — AI runs will use your key");
        setApiKey("");
        qc.invalidateQueries({ queryKey: trpc.workspace.apiKeyStatus.queryKey() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const removeKey = useMutation(
    trpc.workspace.removeApiKey.mutationOptions({
      onSuccess: () => {
        toast.success("Workspace API key removed");
        qc.invalidateQueries({ queryKey: trpc.workspace.apiKeyStatus.queryKey() });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  if (isLoading || !status) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-accent" />
            <CardTitle>Bring your own key</CardTitle>
          </div>
          <CardDescription>
            Connect your OpenRouter API key so every AI step — clarification,
            PRD, tasks, and code review — runs on your account. Keys are
            encrypted at rest per workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {status.workspaceKeySet ? (
              <Badge variant="success">Your key · {status.hint}</Badge>
            ) : status.source === "platform" ? (
              <Badge variant="outline">Using platform default key</Badge>
            ) : (
              <Badge variant="warning">No key configured</Badge>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="openrouter-key">OpenRouter API key</Label>
            <Input
              id="openrouter-key"
              type="password"
              placeholder="sk-or-v1-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Get a key at{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline-offset-4 hover:underline"
              >
                openrouter.ai/keys
              </a>
              . You only see the value once when created.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            onClick={() => setKey.mutate({ apiKey })}
            disabled={apiKey.trim().length < 12 || setKey.isPending}
          >
            {setKey.isPending ? "Saving…" : "Save API key"}
          </Button>
          {status.workspaceKeySet && (
            <Button
              variant="outline"
              onClick={() => removeKey.mutate()}
              disabled={removeKey.isPending}
            >
              <Trash2 className="size-4" />
              Remove key
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs/bring-your-own-key" target="_blank">
              Docs <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
