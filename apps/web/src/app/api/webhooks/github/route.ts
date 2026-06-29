import { NextResponse } from "next/server";
import "@/lib/github/webhook-handlers"; // side-effect import: registers app.webhooks.on(...) listeners
import { githubApp } from "@/lib/github/app";

/**
 * GitHub signs webhooks over the *raw* request body string — re-serializing
 * a parsed JSON object before verifying produces a different byte sequence
 * (key order, whitespace) and fails signature verification. We deliberately
 * read `req.text()` once and pass that exact string to `verifyAndReceive`,
 * never `req.json()` first.
 */
export async function POST(req: Request) {
  const id = req.headers.get("x-github-delivery");
  const name = req.headers.get("x-github-event");
  const signature = req.headers.get("x-hub-signature-256");

  if (!id || !name || !signature) {
    return NextResponse.json({ error: "Missing required webhook headers" }, { status: 400 });
  }

  const rawBody = await req.text();

  try {
    await githubApp.webhooks.verifyAndReceive({
      id,
      // @octokit/webhooks-types' EmitterWebhookEventName is wider than what
      // the X-GitHub-Event header actually sends — cast is safe here since
      // verifyAndReceive validates the signature regardless of name shape.
      name: name as Parameters<typeof githubApp.webhooks.verifyAndReceive>[0]["name"],
      payload: rawBody,
      signature,
    });
  } catch (err) {
    console.error("[github webhook] verification or handler error:", err);
    // Returning 400 tells GitHub to retry (it retries on 4xx/5xx for a
    // limited window) — appropriate for a handler-side bug, not for a
    // genuinely invalid signature, but we don't have a clean way to
    // distinguish the two from verifyAndReceive's thrown error alone.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
