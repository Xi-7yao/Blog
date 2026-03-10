import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/apiUtils';

const buildLimiter = (windowMinutes: number, max: number) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError('Too many requests, please try again later.', 429, 'TOO_MANY_REQUESTS'));
    },
  });

export const authRateLimiter = buildLimiter(15, 20);
export const writeRateLimiter = buildLimiter(5, 30);
export const uploadRateLimiter = buildLimiter(10, 20);
