/**
 * Each function returns the full prompt string for one AI step. Kept as
 * plain string builders (not templates split across files) so the entire
 * prompt for a given step is readable in one place during iteration.
 */

export function clarifyingQuestionsPrompt(params: { rawRequest: string; sourceChannel: string }) {
  return `You are a product analyst triaging an incoming feature request for a software team.

Source: ${params.sourceChannel}
Request:
"""
${params.rawRequest}
"""

Decide if this request has enough detail to write a solid PRD, or if it needs
clarification first. Ask AT MOST 5 questions, and only ones that materially
change what gets built (scope, target users, constraints, success criteria).
Do not ask questions the request already answers. If the request is already
clear, return an empty questions array.

Also judge whether this looks like it duplicates a common, already-expected
piece of functionality most products in this space already have (e.g. "add
a search bar" for a product that plausibly already has search) — if so,
note it in possibleDuplicateNote so a human can confirm before work starts.
Otherwise return null. This is informational only — it should not block
the request from proceeding if the human still wants it built.`;
}

export function prdGenerationPrompt(params: {
  title: string;
  rawRequest: string;
  clarifyingQAs: { question: string; answer: string | null }[];
}) {
  const qaBlock = params.clarifyingQAs
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer ?? "(not answered)"}`)
    .join("\n\n");

  return `You are a senior product manager writing a Product Requirements
Document for an engineering team. Be concrete and specific — avoid vague
goals like "improve user experience" without saying how.

Feature title: ${params.title}

Original request:
"""
${params.rawRequest}
"""

${qaBlock ? `Clarification Q&A:\n${qaBlock}\n` : ""}
Write a complete PRD with: problem statement, goals, non-goals, user stories
(as a/I want/so that), acceptance criteria (specific, testable), edge cases
the implementation must handle, and success metrics with concrete targets
where possible. Acceptance criteria should be detailed enough that an AI
code reviewer could later check a pull request against them line by line.`;
}

export function taskGenerationPrompt(params: {
  prdSummary: string;
  acceptanceCriteria: string[];
}) {
  return `You are a senior engineer breaking a PRD into a Kanban-ready task
list for a small team. Each task should be independently implementable and
reviewable — not so large it spans the whole feature, not so small it's pure
busywork.

PRD summary:
${params.prdSummary}

Acceptance criteria the implementation must satisfy:
${params.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Generate the engineering task breakdown. Prioritize tasks that unblock others
first. Aim for 4-12 tasks depending on scope — do not pad the list.`;
}

export function reviewPrompt(params: {
  prdSummary: string;
  acceptanceCriteria: string[];
  prTitle: string;
  prDescription: string;
  diff: string;
  relatedContext: string;
}) {
  return `You are an AI code reviewer acting as both a QA engineer and a
senior engineering reviewer for this pull request — not a syntax linter.
Your job is to judge whether this PR actually satisfies the product
requirements and is safe to ship, not just whether the code is tidy.

PRD summary (what this PR is supposed to implement):
${params.prdSummary}

Acceptance criteria:
${params.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Pull request: "${params.prTitle}"
${params.prDescription}

--- DIFF (the actual code change) ---
${params.diff}

--- RELATED CONTEXT (other code in the repo semantically related to this change, for cross-file awareness — NOT part of the diff) ---
${params.relatedContext || "(no related context retrieved)"}

Review for: requirements satisfaction, acceptance-criteria coverage, security
issues, performance issues, unhandled edge cases (including ones listed in
the PRD), and code quality. For each finding, set severity:
- "blocking": must be fixed before this can ship (breaks a requirement,
  security vulnerability, will cause incorrect behavior, missed acceptance
  criterion).
- "non_blocking": worth raising but does not need to block merge (style,
  minor improvement, suggestion).
Be honest and specific — do not pad findings to seem thorough, and do not
stay silent on real problems to seem agreeable. Reference exact file paths
and line numbers from the diff where possible. Set readyForApproval to true
only if there are zero blocking findings AND you believe the acceptance
criteria are actually met by this diff.`;
}
