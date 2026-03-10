import { Request, Response } from 'express';
import { FilterQuery, Model } from 'mongoose';
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

const getUnexpectedError = (error: unknown) => (error instanceof Error ? error : new Error('Unknown error'));

const getValidationDetails = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('errors' in error)) {
    return {};
  }

  const rawErrors = (error as { errors?: Record<string, { message?: string }> }).errors ?? {};

  return Object.fromEntries(
    Object.entries(rawErrors).map(([key, value]) => [key, value?.message ?? 'Invalid value'])
  );
};

export const handleError = (res: Response, error: unknown, req?: AuthRequest | Request) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({
      data: null,
      error: { message: error.message, code: error.code },
      status: error.status,
    });
  }

  if (error instanceof Error && error.name === 'TokenExpiredError') {
    const tokenError = error as Error & { expiredAt?: Date };
    console.error('Token expired:', {
      message: tokenError.message,
      expiredAt: tokenError.expiredAt,
      url: req?.originalUrl,
      method: req?.method,
    });

    return res.status(401).json({
      data: null,
      error: { message: 'Token expired', code: 'TOKEN_EXPIRED' },
      status: 401,
    });
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    const details = getValidationDetails(error);
    console.error('Validation error:', {
      details,
      url: req?.originalUrl,
      method: req?.method,
    });

    return res.status(400).json({
      data: null,
      error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details },
      status: 400,
    });
  }

  const unexpectedError = getUnexpectedError(error);
  console.error('Unexpected error:', {
    message: unexpectedError.message,
    stack: unexpectedError.stack,
    url: req?.originalUrl,
    method: req?.method,
    userId: req && 'user' in req ? (req as AuthRequest).user?.userId : undefined,
  });

  return res.status(500).json({
    data: null,
    error: { message: 'Internal server error', code: 'SERVER_ERROR' },
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

export const paginateQuery = async <TDocument, TResult = TDocument>(
  model: Model<TDocument>,
  query: FilterQuery<TDocument>,
  options: PaginateOptions
): Promise<{ items: TResult[]; total: number }> => {
  const { page = 1, limit = 10, sort, select } = options;
  const skip = (page - 1) * limit;
  const itemsQuery = model.find(query).skip(skip).limit(limit);

  if (select) {
    itemsQuery.select(select);
  }

  if (sort) {
    itemsQuery.sort(sort);
  }

  const [items, total] = await Promise.all([
    itemsQuery.lean<TResult[]>(),
    model.countDocuments(query),
  ]);

  return { items, total };
};
