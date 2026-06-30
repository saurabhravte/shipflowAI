import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DocHero,
  DocSection,
  Callout,
  CodeBlock,
  Steps,
} from "@/components/marketing/docs-ui";

export const metadata: Metadata = {
  title: "Bring your own key",
  description:
    "ShipFlow AI is model-agnostic. Plug in your own model API key, choose your models, and keep full control of spend and data.",
};

export default function ByokPage() {
  return (
    <article>
      <DocHero
        eyebrow="Docs · Configuration"
        title="Bring your own key"
        description="ShipFlow is model-agnostic. It routes model calls through OpenRouter, so a single API key unlocks dozens of providers — and your requests, spend, and data stay under your control."
      />

      <DocSection title="Why bring your own key">
        <p>
          Instead of paying a markup on someone else&apos;s inference, you point
          ShipFlow at your own account. You decide which model drafts PRDs and
          which model performs the deeper, more expensive review pass.
        </p>
        <Callout type="tip" title="Tiered routing out of the box">
          ShipFlow uses a fast, cheap model for structured work (PRDs, task
          breakdowns, clarifying questions) and escalates to a stronger model
          only for code review — where it earns its cost.
        </Callout>
      </DocSection>

      <DocSection title="Get a key">
        <Steps
          items={[
            {
              title: "Create an OpenRouter account",
              body: (
                <>
                  Sign up at{" "}
                  <a
                    href="https://openrouter.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    openrouter.ai
                  </a>{" "}
                  and add credits (or connect your own provider keys inside
                  OpenRouter).
                </>
              ),
            },
            {
              title: "Generate an API key",
              body: "Open Keys → Create Key. Copy the value — you will only see it once.",
            },
            {
              title: "Add it to your environment",
              body: "Set the key as an environment variable so ShipFlow can use it for every model call.",
            },
          ]}
        />
      </DocSection>

      <DocSection title="Configure the environment">
        <p>Add the following to your environment file:</p>
        <CodeBlock>{`# apps/web/.env.local

# Your OpenRouter API key — powers all ShipFlow model calls
OPENROUTER_API_KEY="sk-or-..."`}</CodeBlock>
        <p>
          That is the only key required to enable AI features. Restart the dev
          server (or redeploy) after changing it.
        </p>
      </DocSection>

      <DocSection title="Choose your models">
        <p>
          Model routing is centralized in one file, so swapping models is a
          one-line change rather than a search-and-replace across the codebase.
        </p>
        <CodeBlock>{`// apps/web/src/lib/ai/models.ts

export const models = {
  // Structured work: PRDs, task breakdowns, clarifying questions
  fast: openrouter("google/gemini-2.5-flash"),

  // Code review: needs to catch subtle bugs & security issues
  review: openrouter("anthropic/claude-sonnet-4.5"),
} as const;`}</CodeBlock>
        <Callout type="warning" title="Verify slugs before deploying">
          OpenRouter adds and deprecates models regularly. Check the current
          slugs and pricing on the OpenRouter models page before shipping to
          production.
        </Callout>
      </DocSection>

      <DocSection title="Your data boundary">
        <p>
          With your own key, model requests go directly to the provider you
          selected through OpenRouter. Your repositories are used only to
          generate reviews and artifacts for you — never to train models.
        </p>
      </DocSection>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-border/60 pt-8">
        <Button asChild>
          <Link href="/docs/setup">
            Continue to setup <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/docs">Back to overview</Link>
        </Button>
      </div>
    </article>
  );
}
