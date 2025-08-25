// src/middlewares/error.middleware.ts
import { NextFunction, Request, Response } from 'express';

type AppError = Error & { status?: number };

export default function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status ?? 500;
  const message = err.message ?? 'Internal Server Error';

  // Logea lo que necesites
  // console.error(err);

  res.status(status).json({
    ok: false,
    message,
  });
}
