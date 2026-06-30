import "server-only";
import { eq } from "drizzle-orm";
import { db, workspace } from "@shipflow/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { decryptSecret } from "@/lib/crypto/workspace-secrets";

const FAST_MODEL = "google/gemini-2.5-flash";
const REVIEW_MODEL = "anthropic/claude-sonnet-4.5";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

async function resolveApiKey(workspaceId?: string): Promise<string> {
  if (workspaceId) {
    const ws = await db.query.workspace.findFirst({
      where: eq(workspace.id, workspaceId),
      columns: { openrouterApiKeyEnc: true },
    });
    if (ws?.openrouterApiKeyEnc) {
      return decryptSecret(ws.openrouterApiKeyEnc);
    }
  }

  const envKey = process.env.OPENROUTER_API_KEY;
  if (!envKey) {
    throw new Error(
      "No OpenRouter API key configured. Add one in Settings → API keys or set OPENROUTER_API_KEY.",
    );
  }
  return envKey;
}

export async function getModelsForWorkspace(workspaceId: string) {
  const apiKey = await resolveApiKey(workspaceId);
  const openrouter = createOpenRouter({ apiKey });
  return {
    fast: openrouter(FAST_MODEL),
    review: openrouter(REVIEW_MODEL),
    embedding: openrouter.textEmbeddingModel(EMBEDDING_MODEL),
  };
}

/** Fallback for code paths without a workspace context (uses env key only). */
const defaultOpenRouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

export const models = {
  fast: defaultOpenRouter(FAST_MODEL),
  review: defaultOpenRouter(REVIEW_MODEL),
} as const;

export const embeddingModel = defaultOpenRouter.textEmbeddingModel(EMBEDDING_MODEL);
