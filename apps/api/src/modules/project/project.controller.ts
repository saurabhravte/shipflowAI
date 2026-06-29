import type { Request, Response, NextFunction } from "express";
import * as svc from "./project.services";
import { ok, created, noContent } from "../../common/utils/apiResponse";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await svc.listProjects(req.user!.workspaceId!)); } catch (e) { next(e); }
};
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = req.body as { name: string; description?: string };
    created(res, await svc.createProject(req.user!.workspaceId!, b.name, b.description));
  } catch (e) { next(e); }
};
export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await svc.getProjectById(req.params.id!, req.user!.workspaceId!)); } catch (e) { next(e); }
};
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await svc.updateProject(req.params.id!, req.user!.workspaceId!, req.body as { name?: string; description?: string }));
  } catch (e) { next(e); }
};
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try { await svc.deleteProject(req.params.id!, req.user!.workspaceId!); noContent(res); } catch (e) { next(e); }
};
