import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineFlow } from "@/components/marketing/pipeline-flow";
import { DocHero, DocSection, Callout, Steps } from "@/components/marketing/docs-ui";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Understand the ShipFlow AI pipeline — from a raw feature request to a reviewed, merged pull request.",
};

export default function DocsHowItWorksPage() {
  return (
    <article>
      <DocHero
        eyebrow="Docs · Overview"
        title="How ShipFlow works"
        description="ShipFlow AI is an AI code-review platform with an autonomous shipping pipeline. It takes a feature request all the way to a reviewed, merged pull request — and keeps a human in the loop at the gate that matters."
      />

      <div className="mb-8">
        <PipelineFlow />
      </div>

      <DocSection title="The core loop">
        <p>
          Every feature request moves through the same, always-visible pipeline.
          Each stage is durable: if a model call fails, only that step retries —
          never the whole run.
        </p>
        <Steps
          items={[
            {
              title: "Request",
              body: "Paste a raw request — a customer email, a support ticket, or a one-liner. ShipFlow detects possible duplicates and asks clarifying questions when context is missing.",
            },
            {
              title: "PRD",
              body: "A structured product spec is drafted automatically: problem statement, goals, non-goals, user stories, acceptance criteria, edge cases, and success metrics. You can edit everything before approving.",
            },
            {
              title: "Tasks",
              body: "The approved PRD is broken into an actionable task board so the work is scoped before any code is written.",
            },
            {
              title: "Build & AI review",
              body: "As pull requests open, ShipFlow reviews them with full-repository context — flagging real bugs, security issues, and regressions, then proposing concrete fixes.",
            },
            {
              title: "Human approval & ship",
              body: "AI does the review; a human does the deciding. Once approved at the gate, the change is routed to merge and the request is marked shipped.",
            },
          ]}
        />
      </DocSection>

      <DocSection title="What makes the review different">
        <p>
          Tools like CodeRabbit, Qodo Merge, Greptile, and Korbit comment on a
          PR after it exists. ShipFlow reads the diff{" "}
          <em>and</em> the surrounding codebase, so reviews understand how a
          change interacts with the rest of your repo — not just the lines that
          moved.
        </p>
        <Callout type="tip" title="Repo-aware by design">
          Relevant files and prior context are retrieved and fed into the review
          model, which is why ShipFlow catches issues that line-level linters and
          diff-only reviewers miss.
        </Callout>
      </DocSection>

      <DocSection title="Architecture in one minute">
        <p>
          The dashboard is a Next.js App Router UI. Actions trigger durable
          background workflows that fetch from GitHub, call your chosen models,
          and persist results to Postgres. Because work is event-driven, the UI
          responds instantly while the heavy lifting happens in the background.
        </p>
        <Callout type="info" title="Human-in-the-loop, always">
          Nothing ships autonomously. The approval gate is a hard stop that
          requires a real person to sign off.
        </Callout>
      </DocSection>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-border/60 pt-8">
        <Button asChild>
          <Link href="/docs/setup">
            Quick setup <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/docs/bring-your-own-key">Bring your own key</Link>
        </Button>
      </div>
    </article>
  );
}
