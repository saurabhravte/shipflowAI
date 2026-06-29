import { randomUUID } from "crypto";

/**
 * Prefixed IDs (e.g. "ws_8f2a...") make logs and DB browsing legible —
 * you can tell what a foreign key points to without a join.
 * Swap this for @paralleldrive/cuid2 later if you want shorter IDs;
 * keeping it dependency-free for now since crypto.randomUUID is built in.
 */
export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
