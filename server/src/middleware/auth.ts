import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/apiUtils';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

const decodeAccessToken = (token: string) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('服务器配置错误', 500, 'CONFIG_ERROR');
  }

  return jwt.verify(token, process.env.JWT_SECRET) as {
    userId: string;
    email: string;
    role: string;
  };
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    throw new AppError('未授权', 401, 'UNAUTHORIZED');
  }

  try {
    req.user = decodeAccessToken(token);
    next();
  } catch (error) {
    throw new AppError('无效的 token', 401, 'INVALID_TOKEN');
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
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
