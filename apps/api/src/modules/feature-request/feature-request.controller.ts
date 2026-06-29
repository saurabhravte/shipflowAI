import type { Request, Response, NextFunction } from "express";
import * as svc from "./feature-request.services";
import { ok, created } from "../../common/utils/apiResponse";

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await svc.listFeatureRequests(req.user!.workspaceId!));
  } catch (e) {
    next(e);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const b = req.body as {
      projectId: string;
      title: string;
      description: string;
    };

    created(
      res,
      await svc.createFeatureRequest(
        req.user!.workspaceId!,
        b.projectId,
        req.user!.userId,
        b.title,
        b.description,
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    ok(res, await svc.getFeatureRequestById(req.params.id!));
  } catch (e) {
    next(e);
  }
};
