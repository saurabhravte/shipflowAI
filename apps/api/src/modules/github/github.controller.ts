import type { Request, Response, NextFunction } from "express";
import * as svc from "./github.services";
import { ok } from "../../common/utils/apiResponse";

export const getInstallUrl = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, { url: await svc.getInstallUrl(req.user!.workspaceId!) }); } catch (e) { next(e); }
};
export const getInstallation = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await svc.getInstallation(req.user!.workspaceId!)); } catch (e) { next(e); }
};
export const listRepos = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await svc.listRepositories(req.user!.workspaceId!)); } catch (e) { next(e); }
};
