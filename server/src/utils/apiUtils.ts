import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth';

export class AppError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
// 错误处理函数
export const handleError = (res: Response, error: any, req?: AuthRequest | Request) => {
  // console.log(error);

  // 处理 AppError
  if (error instanceof AppError) {
    return res.status(error.status).json({
      data: null,
      error: { message: error.message, code: error.code },
      status: error.status,
    });
  }

  // 处理 TokenExpiredError
  if (error.name === 'TokenExpiredError') {
    console.error('Token expired:', {
      message: error.message,
      expiredAt: error.expiredAt,
      url: req?.originalUrl,
      method: req?.method,
    });
    return res.status(401).json({
      data: null,
      error: { message: '令牌已过期', code: 'TOKEN_EXPIRED' },
      status: 401,
    });
  }

  // 处理 ValidationError
  if (error.name === 'ValidationError') {
    const errorDetails = {
      errors: Object.fromEntries(
        Object.entries(error.errors).map(([key, val]: [string, any]) => [key, val.message])
      ),
    };
    console.error('Validation error:', {
      ...errorDetails,
      url: req?.originalUrl,
      method: req?.method,
    });
    return res.status(400).json({
      data: null,
      error: { message: '验证错误', code: 'VALIDATION_ERROR', details: errorDetails.errors },
      status: 400,
    });
  }

  // 处理其他意外错误
  const errorDetails = { message: error.message, stack: error.stack };
  console.error('Unexpected error:', {
    ...errorDetails,
    url: req?.originalUrl,
    method: req?.method,
    userId: req && 'user' in req ? (req as AuthRequest).user?.userId : undefined,
  });
  return res.status(500).json({
    data: null,
    error: { message: '服务器错误', code: 'SERVER_ERROR', err: error },
    status: 500,
  });
};

export const sendResponse = <T>(res: Response, data: T, status = 200) => {
  res.status(status).json({
    data,
    error: null,
    status,
  });
};

export interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  select?: string;
}

export const paginateQuery = async <T>(
  model: any,
  query: any,
  options: PaginateOptions
): Promise<{ items: T[]; total: number }> => {
  const { page = 1, limit = 10, sort, select } = options;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    model
      .find(query)
      .select(select)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean(),
    model.countDocuments(query),
  ]);
  return { items, total };
};