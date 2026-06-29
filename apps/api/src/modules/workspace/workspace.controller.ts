import type { Request, Response, NextFunction } from "express";
import { listWorkspacesForUser, createWorkspace, getWorkspaceById } from "./workspace.services";
import { ok, created } from "../../common/utils/apiResponse";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const workspaces = await listWorkspacesForUser(req.user!.userId);
    ok(res, workspaces);
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const ws = await createWorkspace((req.body as { name: string }).name, req.user!.userId);
    created(res, ws, "Workspace created");
  } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const ws = await getWorkspaceById(req.params.id!, req.user!.userId);
    ok(res, ws);
  } catch (e) { next(e); }
}
