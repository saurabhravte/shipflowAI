import "server-only";
import { Pinecone } from "@pinecone-database/pinecone";
import { embedMany, embed } from "ai";
import { getModelsForWorkspace } from "../ai/models";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

/**
 * One index for the whole app, namespaced per repository (`repo:{repositoryId}`)
 * per ARCHITECTURE.md Section 5. Index must be pre-created with dimension
 * 1536 to match the embedding model in lib/ai/models.ts — see README setup
 * steps (Pass 6) for the exact `pc.createIndex(...)` call to run once.
 */
const index = pc.index(process.env.PINECONE_INDEX as string);

export type CodeChunkMetadata = {
  filePath: string;
  prNumber: number;
  sha: string;
  startLine: number;
  endLine: number;
};

function namespaceFor(repositoryId: string) {
  return `repo:${repositoryId}`;
}

/**
 * Naive line-window chunking — explicitly NOT Tree-sitter AST chunking, per
 * the diff-scoped-only decision in ARCHITECTURE.md Section 5. Each chunk is
 * ~80 lines with a small overlap so a finding near a window boundary still
 * has surrounding context in at least one chunk.
 */
export function chunkFileContent(content: string, windowSize = 80, overlap = 10) {
  const lines = content.split("\n");
  const chunks: { text: string; startLine: number; endLine: number }[] = [];

  for (let start = 0; start < lines.length; start += windowSize - overlap) {
    const end = Math.min(start + windowSize, lines.length);
    chunks.push({
      text: lines.slice(start, end).join("\n"),
      startLine: start + 1,
      endLine: end,
    });
    if (end === lines.length) break;
  }

  return chunks;
}

/**
 * Embeds and upserts chunks for one changed file. Called once per changed
 * file in the review workflow (Pass 4 review-pr.ts), inside a step.run() so
 * a crash mid-PR doesn't silently skip files.
 */
export async function indexFileChunks(params: {
  workspaceId: string;
  repositoryId: string;
  filePath: string;
  content: string;
  prNumber: number;
  sha: string;
}) {
  const chunks = chunkFileContent(params.content);
  if (chunks.length === 0) return;

  const { embedding } = await getModelsForWorkspace(params.workspaceId);

  const { embeddings } = await embedMany({
    model: embedding,
    values: chunks.map((c) => c.text),
  });

  await index.namespace(namespaceFor(params.repositoryId)).upsert(
    chunks.map((chunk, i) => ({
      id: `${params.filePath}::${chunk.startLine}-${chunk.endLine}`,
      values: embeddings[i]!,
      metadata: {
        filePath: params.filePath,
        prNumber: params.prNumber,
        sha: params.sha,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
      } satisfies CodeChunkMetadata,
    })),
  );
}

/**
 * Semantic search within a repository's namespace, used to pull in
 * cross-file context beyond the raw diff (the "shallow context" problem
 * called out in the PRD's competitive analysis). Excludes chunks from the
 * file currently being reviewed — that content is already in the diff.
 */
export async function findRelatedChunks(params: {
  workspaceId: string;
  repositoryId: string;
  queryText: string;
  excludeFilePath?: string;
  topK?: number;
}) {
  const { embedding } = await getModelsForWorkspace(params.workspaceId);
  const { embedding: queryVec } = await embed({ model: embedding, value: params.queryText });

  const results = await index.namespace(namespaceFor(params.repositoryId)).query({
    vector: queryVec,
    topK: params.topK ?? 8,
    includeMetadata: true,
    ...(params.excludeFilePath
      ? { filter: { filePath: { $ne: params.excludeFilePath } } }
      : {}),
  });

  return results.matches.map((m) => ({
    score: m.score,
    metadata: m.metadata as unknown as CodeChunkMetadata,
  }));
}
