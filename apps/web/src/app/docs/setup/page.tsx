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
  title: "Quick setup",
  description:
    "Get ShipFlow AI running in under ten minutes — connect GitHub, link a repo, and open your first feature request.",
};

export default function SetupPage() {
  return (
    <article>
      <DocHero
        eyebrow="Docs · Getting started"
        title="Quick setup"
        description="From zero to your first reviewed pull request in under ten minutes. You can use the hosted app, or run it locally."
      />

      <DocSection title="Using the hosted app">
        <Steps
          items={[
            {
              title: "Create your account",
              body: (
                <>
                  <Link
                    href="/sign-up"
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    Sign up
                  </Link>{" "}
                  with email, Google, or GitHub. A personal workspace is created
                  for you automatically.
                </>
              ),
            },
            {
              title: "Connect the GitHub App",
              body: "From Settings → GitHub, install the ShipFlow GitHub App and grant it access to the repositories you want reviewed.",
            },
            {
              title: "Create a project & link a repo",
              body: "Projects group feature requests around a repository. Create one, then link a connected repo to it.",
            },
            {
              title: "Open your first feature request",
              body: "Paste a raw request. ShipFlow drafts a PRD, breaks it into tasks, and reviews the resulting pull request — all visible on the pipeline.",
            },
          ]}
        />
        <Callout type="tip" title="Bring your own key first">
          Add your model API key before your first run so AI features are live
          from the start. See{" "}
          <Link
            href="/docs/bring-your-own-key"
            className="text-accent underline-offset-4 hover:underline"
          >
            Bring your own key
          </Link>
          .
        </Callout>
      </DocSection>

      <DocSection title="Running locally">
        <p>Prerequisites: Node 20+, pnpm 9+, and a PostgreSQL database.</p>
        <CodeBlock>{`# 1. Clone & install
git clone https://github.com/saurabhravte/shipflowAI.git
cd shipflowAI
pnpm install

# 2. Configure environment
cp apps/web/.env.example apps/web/.env.local
# fill in DATABASE_URL, BETTER_AUTH_SECRET, OPENROUTER_API_KEY, ...

# 3. Set up the database
pnpm --filter web db:generate
pnpm --filter web db:migrate

# 4. Start the dev server
pnpm dev`}</CodeBlock>
        <p>
          In a second terminal, start the durable workflow dev server so
          background pipeline steps run locally:
        </p>
        <CodeBlock>{`npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`}</CodeBlock>
      </DocSection>

      <DocSection title="Required environment variables">
        <CodeBlock>{`DATABASE_URL="postgresql://user:password@host:5432/shipflowai"
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
OPENROUTER_API_KEY="sk-or-..."          # your model key (BYOK)
GITHUB_APP_ID="your-github-app-id"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"`}</CodeBlock>
        <Callout type="info" title="Social login is optional">
          Email/password works out of the box. Add the Google / GitHub OAuth
          variables only if you want those sign-in buttons enabled.
        </Callout>
      </DocSection>

      <DocSection title="Connect a repository for reviews">
        <p>
          ShipFlow uses a GitHub App for repository access and webhooks. Install
          it on the org or account that owns your repos, select the repositories
          to grant access to, and link them to a project. Pull request events
          then trigger AI reviews automatically.
        </p>
      </DocSection>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-border/60 pt-8">
        <Button asChild>
          <Link href="/sign-up">
            Create your account <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/docs/bring-your-own-key">Bring your own key</Link>
        </Button>
      </div>
    </article>
  );
}
