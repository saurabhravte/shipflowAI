"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { Badge } from "@/components/ui/badge";
import { FixNeededPanel } from "@/components/fix-needed-panel";
import { WorkflowErrorAlert } from "@/components/workflow-error-alert";
import { ClarifyingQuestionsPanel } from "./clarifying-panel";
import { PrdEditorPanel } from "./prd-editor-panel";
import { TaskBoardPanel } from "./task-board-panel";
import { PullRequestPanel } from "./pull-request-panel";
import { ApprovalPanel } from "./approval-panel";

export default function FeatureRequestDetailPage() {
  const { featureRequestId } = useParams<{ featureRequestId: string }>();
  const trpc = useTRPC();
  const { data: fr, isLoading } = useQuery({
    ...trpc.featureRequest.get.queryOptions({ featureRequestId }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const isProcessing =
        status === "clarifying" ||
        status === "prd_generating" ||
        status === "tasks_generating" ||
        status === "ai_reviewing";
      return isProcessing ? 3000 : false;
    },
  });

  const { data: pullRequests } = useQuery({
    ...trpc.pullRequest.listForFeatureRequest.queryOptions({ featureRequestId }),
    enabled: fr?.status === "fix_needed" || fr?.status === "in_development",
  });

  if (isLoading || !fr) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const repo = fr.linkedRepository
    ? { fullName: fr.linkedRepository.fullName, defaultBranch: fr.linkedRepository.defaultBranch }
    : null;

  const showPrd = [
    "prd_review",
    "tasks_generating",
    "tasks_review",
    "in_development",
    "ai_reviewing",
    "fix_needed",
    "human_approval",
    "shipped",
  ].includes(fr.status);
  const showTasks = [
    "tasks_review",
    "in_development",
    "ai_reviewing",
    "fix_needed",
    "human_approval",
    "shipped",
  ].includes(fr.status);
  const showPullRequests = [
    "in_development",
    "ai_reviewing",
    "fix_needed",
    "human_approval",
    "shipped",
  ].includes(fr.status);
  const showApproval = fr.status === "human_approval";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{fr.title}</h1>
            {fr.duplicateOfNote && <Badge variant="warning">Possible duplicate</Badge>}
            {fr.status === "shipped" && <Badge>Shipped</Badge>}
            {fr.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
          </div>
          <p className="font-data text-xs text-muted-foreground">{fr.id}</p>
          {fr.duplicateOfNote && (
            <p className="mt-1 text-sm text-muted-foreground">{fr.duplicateOfNote}</p>
          )}
        </div>
        <PipelineStepper status={fr.status} />
      </div>

      {fr.workflowError && (
        <WorkflowErrorAlert
          featureRequestId={featureRequestId}
          message={fr.workflowError}
          canRetry={fr.status === "draft"}
        />
      )}

      {fr.status === "clarifying" && (
        <ClarifyingQuestionsPanel featureRequestId={featureRequestId} exchanges={fr.clarifyingExchanges} />
      )}

      {(fr.status === "prd_generating" || fr.status === "tasks_generating") && !fr.workflowError && (
        <p className="text-sm text-muted-foreground">
          ShipFlow&apos;s AI is working on this — the page will update automatically.
        </p>
      )}

      {fr.status === "fix_needed" && (
        <FixNeededPanel
          featureRequestId={featureRequestId}
          featureTitle={fr.title}
          repository={repo}
          pullRequestUrl={pullRequests?.[0]?.url}
        />
      )}

      {showPrd && fr.prd && (
        <PrdEditorPanel
          featureRequestId={featureRequestId}
          canReject={fr.status === "prd_review"}
          initialPrd={{
            problemStatement: fr.prd.problemStatement,
            goals: fr.prd.goals,
            nonGoals: fr.prd.nonGoals,
            userStories: fr.prd.userStories,
            acceptanceCriteria: fr.prd.acceptanceCriteria,
            edgeCases: fr.prd.edgeCases,
            successMetrics: fr.prd.successMetrics,
            approvedAt: fr.prd.approvedAt,
          }}
        />
      )}

      {showTasks && (
        <TaskBoardPanel
          featureRequestId={featureRequestId}
          canApprovePlan={fr.status === "tasks_review"}
          featureTitle={fr.title}
          repository={repo}
        />
      )}

      {showPullRequests && <PullRequestPanel featureRequestId={featureRequestId} repository={repo} featureTitle={fr.title} />}

      {showApproval && <ApprovalPanel featureRequestId={featureRequestId} />}
    </div>
  );
}
