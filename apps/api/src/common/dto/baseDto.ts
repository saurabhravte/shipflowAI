import { z } from "zod";

// ── Pagination ──────────────────────────────────────────────────────────────
export const PaginationDto = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationDto = z.infer<typeof PaginationDto>;

// ── Workspace-scoped base ───────────────────────────────────────────────────
export const WorkspaceScopedDto = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
});
export type WorkspaceScopedDto = z.infer<typeof WorkspaceScopedDto>;

// ── ID param ────────────────────────────────────────────────────────────────
export const IdParamDto = z.object({
  id: z.string().min(1),
});
export type IdParamDto = z.infer<typeof IdParamDto>;
