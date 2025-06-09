import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/apiUtils';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    throw new AppError('未授权', 401, 'UNAUTHORIZED');
  }
  try {
    if (!process.env.JWT_SECRET) {
      throw new AppError('服务器配置错误', 500, 'CONFIG_ERROR');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError('无效的 token', 401, 'INVALID_TOKEN');
  }
};