"use client";

import { AlertTriangle, GitPullRequest } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShipFlowTagHelper } from "@/components/shipflow-tag-helper";

export function FixNeededPanel({
  featureRequestId,
  featureTitle,
  repository,
  pullRequestUrl,
}: {
  featureRequestId: string;
  featureTitle: string;
  repository?: { fullName: string; defaultBranch: string } | null;
  pullRequestUrl?: string | null;
}) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-destructive">Fixes needed before approval</p>
            <p className="text-sm text-muted-foreground">
              The AI review found blocking issues. Address them in your linked pull request, then push
              your changes — ShipFlow will automatically re-run the review.
            </p>
            {pullRequestUrl && (
              <a
                href={pullRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <GitPullRequest className="size-3.5" />
                View pull request on GitHub
              </a>
            )}
          </div>
        </div>
        <ShipFlowTagHelper
          featureRequestId={featureRequestId}
          featureTitle={featureTitle}
          repository={repository}
          variant="inline"
        />
      </CardContent>
    </Card>
  );
}
