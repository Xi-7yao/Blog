import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/apiUtils';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

const decodeAccessToken = (token: string) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('Server JWT configuration is missing.', 500, 'CONFIG_ERROR');
  }

  return jwt.verify(token, process.env.JWT_SECRET) as {
    userId: string;
    email: string;
    role: string;
  };
};

const isTokenExpiredError = (error: unknown): error is Error => {
  return error instanceof Error && error.name === 'TokenExpiredError';
};

export const authMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  try {
    req.user = decodeAccessToken(token);
    next();
  } catch (error) {
    if (error instanceof AppError || isTokenExpiredError(error)) {
      throw error;
    }

    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    next();
    return;
  }

  try {
    req.user = decodeAccessToken(token);
  } catch (error) {
    req.user = undefined;
  }

  next();
};
