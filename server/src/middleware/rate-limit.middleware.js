import { rateLimit } from 'express-rate-limit';
import { sendResponse } from '../utils/response.js';

export function createApiLimiter() {
  return rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      sendResponse(res, {
        status: 429,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
      }),
  });
}

export function createAuthLimiter(rateLimitEnabled) {
  return rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    skip: () => !rateLimitEnabled,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      sendResponse(res, {
        status: 429,
        message: 'Thử đăng nhập quá nhiều lần. Vui lòng chờ 15 phút.',
      }),
  });
}
