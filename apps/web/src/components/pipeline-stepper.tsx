import { cn } from "@/lib/utils";
import {
  Check,
  Sparkles,
  FileText,
  ListTree,
  Code2,
  ShieldCheck,
  UserCheck,
  Rocket,
  XCircle,
} from "lucide-react";

type Status =
  | "draft"
  | "clarifying"
  | "prd_generating"
  | "prd_review"
  | "tasks_generating"
  | "tasks_review"
  | "in_development"
  | "ai_reviewing"
  | "fix_needed"
  | "human_approval"
  | "shipped"
  | "rejected";

/**
 * The visual identity of the product: every feature request's journey
 * through the core loop, always visible, always in the same place. This is
 * deliberately the one place we spend real visual energy — everywhere else
 * stays quiet and functional. Maps directly to
 * server/workflows/state-machine.ts; the two files should always agree.
 */
const STAGES: {
  key: Status;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "draft", label: "Request", icon: Sparkles },
  { key: "clarifying", label: "Clarify", icon: Sparkles },
  { key: "prd_review", label: "PRD", icon: FileText },
  { key: "tasks_review", label: "Tasks", icon: ListTree },
  { key: "in_development", label: "Build", icon: Code2 },
  { key: "ai_reviewing", label: "AI Review", icon: ShieldCheck },
  { key: "human_approval", label: "Approval", icon: UserCheck },
  { key: "shipped", label: "Shipped", icon: Rocket },
];

// Collapse generation states into the stage that follows them (e.g.
// "prd_generating" visually sits at the "PRD" stage, just not complete yet).
const STAGE_INDEX: Record<Status, number> = {
  draft: 0,
  clarifying: 1,
  prd_generating: 2,
  prd_review: 2,
  tasks_generating: 3,
  tasks_review: 3,
  in_development: 4,
  ai_reviewing: 5,
  fix_needed: 5,
  human_approval: 6,
  shipped: 7,
  rejected: -1, // rendered as a distinct terminal state, not on the happy path
};

export function PipelineStepper({ status }: { status: Status }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        <XCircle className="size-4" />
        Rejected — this feature request did not proceed to release.
      </div>
    );
  }

  const currentIndex = STAGE_INDEX[status];
  const isActivelyWorking = [
    "clarifying",
    "prd_generating",
    "tasks_generating",
    "ai_reviewing",
  ].includes(status);
  const isFixNeeded = status === "fix_needed";

  return (
    <ol className="flex items-stretch" aria-label="Feature request progress">
      {STAGES.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const Icon = stage.icon;

        return (
          <li
            key={stage.key}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 font-data text-xs transition-colors",
                  isDone && "border-success bg-success text-success-foreground",
                  isCurrent &&
                    !isFixNeeded &&
                    "border-accent bg-accent text-accent-foreground",
                  isCurrent &&
                    isFixNeeded &&
                    "border-warning bg-warning text-warning-foreground",
                  !isDone &&
                    !isCurrent &&
                    "border-border bg-muted text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? (
                  <Check className="size-4" />
                ) : (
                  <Icon
                    className={cn(
                      "size-4",
                      isCurrent && isActivelyWorking && "animate-pulse",
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                  i < currentIndex ? "bg-success" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
