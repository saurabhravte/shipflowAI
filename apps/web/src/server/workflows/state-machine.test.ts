import { describe, expect, it } from "vitest";
import { assertTransition, InvalidTransitionError } from "./state-machine";

describe("feature request state machine", () => {
  it("allows the happy-path forward transitions", () => {
    expect(() => assertTransition("draft", "clarifying")).not.toThrow();
    expect(() => assertTransition("clarifying", "prd_generating")).not.toThrow();
    expect(() => assertTransition("prd_generating", "prd_review")).not.toThrow();
    expect(() => assertTransition("prd_review", "tasks_generating")).not.toThrow();
    expect(() => assertTransition("tasks_generating", "tasks_review")).not.toThrow();
    expect(() => assertTransition("tasks_review", "in_development")).not.toThrow();
    expect(() => assertTransition("in_development", "ai_reviewing")).not.toThrow();
    expect(() => assertTransition("ai_reviewing", "human_approval")).not.toThrow();
    expect(() => assertTransition("human_approval", "shipped")).not.toThrow();
  });

  it("allows the fix-needed re-review loop", () => {
    expect(() => assertTransition("ai_reviewing", "fix_needed")).not.toThrow();
    expect(() => assertTransition("fix_needed", "ai_reviewing")).not.toThrow();
  });

  it("allows reject paths at human gates", () => {
    expect(() => assertTransition("prd_review", "rejected")).not.toThrow();
    expect(() => assertTransition("tasks_review", "rejected")).not.toThrow();
    expect(() => assertTransition("human_approval", "rejected")).not.toThrow();
    expect(() => assertTransition("human_approval", "fix_needed")).not.toThrow();
  });

  it("allows recoverable PRD generation failure back to draft", () => {
    expect(() => assertTransition("prd_generating", "draft")).not.toThrow();
  });

  it("blocks illegal transitions", () => {
    expect(() => assertTransition("shipped", "draft")).toThrow(InvalidTransitionError);
    expect(() => assertTransition("draft", "shipped")).toThrow(InvalidTransitionError);
    expect(() => assertTransition("prd_review", "in_development")).toThrow(InvalidTransitionError);
  });
});
