import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Tiered model routing per ARCHITECTURE.md / the PRD's cost-optimization
 * section: a cheap/fast model for first-pass work, escalate to a stronger
 * model only where it earns its cost. Centralized here so swapping models
 * is a one-line change, not a grep-and-replace across every workflow file.
 *
 * MODEL SLUGS BELOW ARE A STARTING POINT, NOT VERIFIED AGAINST OPENROUTER'S
 * LIVE CATALOG — check https://openrouter.ai/models for current available
 * slugs and pricing before deploying; OpenRouter adds/deprecates models
 * regularly and exact slug strings (version suffixes etc.) do change.
 */
export const models = {
  /** PRD generation, task breakdown, clarifying questions — structured but not adversarial. */
  fast: openrouter("google/gemini-2.5-flash"),
  /** Code review — needs to actually catch subtle bugs and security issues. */
  review: openrouter("anthropic/claude-sonnet-4.5"),
} as const;

/** 1536-dim to match the architecture doc and Pinecone index config. Verify slug on OpenRouter's models page too. */
export const embeddingModel = openrouter.textEmbeddingModel("openai/text-embedding-3-small");
