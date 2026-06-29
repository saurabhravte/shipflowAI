import type { Response } from "express";

interface ApiResponseShape<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export class ApiResponse<T> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data?: T;
  public readonly meta?: Record<string, unknown>;

  constructor(
    public readonly statusCode: number,
    message: string,
    data?: T,
    meta?: Record<string, unknown>
  ) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  send(res: Response): Response<ApiResponseShape<T>> {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      meta: this.meta,
    });
  }
}

// Helpers
export const ok = <T>(res: Response, data: T, message = "Success") =>
  new ApiResponse(200, message, data).send(res);

export const created = <T>(res: Response, data: T, message = "Created") =>
  new ApiResponse(201, message, data).send(res);

export const noContent = (res: Response) => res.status(204).send();
