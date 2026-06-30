"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function buildShipFlowTag(featureRequestId: string) {
  return `ShipFlow: ${featureRequestId}`;
}

export function buildGithubNewPrUrl(params: {
  fullName: string;
  defaultBranch: string;
  title: string;
  body: string;
}) {
  const { fullName, defaultBranch, title, body } = params;
  const qs = new URLSearchParams({
    quick_pull: "1",
    title,
    body,
  });
  return `https://github.com/${fullName}/compare/${defaultBranch}...?${qs.toString()}`;
}

export function ShipFlowTagHelper({
  featureRequestId,
  featureTitle,
  repository,
  variant = "card",
}: {
  featureRequestId: string;
  featureTitle?: string;
  repository?: { fullName: string; defaultBranch: string } | null;
  variant?: "card" | "inline";
}) {
  const [copied, setCopied] = useState(false);
  const tag = buildShipFlowTag(featureRequestId);

  async function copyTag() {
    await navigator.clipboard.writeText(tag);
    setCopied(true);
    toast.success("ShipFlow tag copied");
    setTimeout(() => setCopied(false), 2000);
  }

  const prTitle = featureTitle ? `feat: ${featureTitle}` : "feat: ShipFlow feature";
  const prBody = `${tag}\n\nImplementation for this ShipFlow feature request.`;
  const githubUrl = repository
    ? buildGithubNewPrUrl({
        fullName: repository.fullName,
        defaultBranch: repository.defaultBranch,
        title: prTitle,
        body: prBody,
      })
    : null;

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <code className="font-data rounded bg-muted px-1.5 py-0.5 text-xs">{tag}</code>
        <Button variant="outline" size="sm" onClick={copyTag}>
          <Copy className="size-3.5" />
          {copied ? "Copied" : "Copy tag"}
        </Button>
        {githubUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <Github className="size-3.5" />
              Open PR on GitHub
              <ExternalLink className="size-3" />
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-4">
      <p className="text-sm font-medium">Link your pull request</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Include this tag in your PR title or description so ShipFlow links it automatically.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="font-data rounded-md bg-background px-2 py-1 text-sm">{tag}</code>
        <Button variant="outline" size="sm" onClick={copyTag}>
          <Copy className="size-3.5" />
          {copied ? "Copied" : "Copy tag"}
        </Button>
        {githubUrl ? (
          <Button size="sm" asChild>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <Github className="size-3.5" />
              Open PR on GitHub
              <ExternalLink className="size-3" />
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Connect a repository to this project for a pre-filled GitHub PR link.
          </span>
        )}
      </div>
    </div>
  );
}
