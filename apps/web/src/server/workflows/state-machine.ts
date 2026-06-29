import "server-only";
import { eq } from "drizzle-orm";
import { db, featureRequest } from "@shipflow/db";

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
 * The complete legal-transition table. Every status change in the app goes
 * through `assertTransition` first — Inngest functions, tRPC mutations, and
 * the GitHub webhook handler alike. This is what ARCHITECTURE.md Section 3
 * means by "centralized in a typed transition table" — adding a new status
 * or a new path between statuses means editing exactly this object, and
 * every caller benefits immediately.
 */
const TRANSITIONS: Record<Status, Status[]> = {
  draft: ["clarifying", "prd_generating"], // straight to PRD if AI judges no clarification needed
  clarifying: ["prd_generating"],
  prd_generating: ["prd_review"],
  prd_review: ["tasks_generating", "rejected"],
  tasks_generating: ["tasks_review"],
  tasks_review: ["in_development", "rejected"],
  in_development: ["ai_reviewing"],
  ai_reviewing: ["fix_needed", "human_approval"],
  fix_needed: ["ai_reviewing"], // re-review loop — see Phase 4 of the PRD
  human_approval: ["shipped", "rejected", "fix_needed"], // human can bounce back with notes
  shipped: [],
  rejected: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: Status, to: Status) {
    super(`Illegal feature request transition: ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
  }
}

/** Throws InvalidTransitionError if `to` isn't reachable from `from`. Call before every status write. */
export function assertTransition(from: Status, to: Status): void {
  if (!TRANSITIONS[from]?.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/**
 * Reads current status, validates the transition, and writes the new
 * status in one place — the single function every workflow/mutation should
 * call rather than hand-rolling `db.update(featureRequest).set({status})`.
 */
export async function transitionFeatureRequest(featureRequestId: string, to: Status) {
  const current = await db.query.featureRequest.findFirst({
    where: eq(featureRequest.id, featureRequestId),
  });
  if (!current) {
    throw new Error(`FeatureRequest ${featureRequestId} not found`);
  }

  assertTransition(current.status, to);

  await db.update(featureRequest).set({ status: to }).where(eq(featureRequest.id, featureRequestId));

  return { from: current.status, to };
}
