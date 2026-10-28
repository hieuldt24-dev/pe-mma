import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createApiRouter } from './routes/index.js';
import { createApiLimiter } from './middleware/rate-limit.middleware.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

export function createApp({
  jwtSecret,
  corsOrigins = ['http://localhost:8081'],
  rateLimitEnabled = true,
}) {
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.startsWith('REPLACE_'))
    throw new Error('JWT_SECRET cần ít nhất 32 ký tự ngẫu nhiên.');
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: '16kb' }));
  if (rateLimitEnabled) app.use('/api', createApiLimiter());
  app.use('/api', createApiRouter({ jwtSecret, rateLimitEnabled }));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
