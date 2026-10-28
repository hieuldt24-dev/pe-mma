import { Router } from 'express';
import { get as health } from '../controller/health.controller.js';
import { createAuthService } from '../service/auth.service.js';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import { createPublicAuthRouter, createPrivateAuthRouter } from './auth.routes.js';
import transactionRouter from './transaction.routes.js';
import budgetRouter from './budget.routes.js';
import summaryRouter from './summary.routes.js';

export function createApiRouter({ jwtSecret, rateLimitEnabled }) {
  const router = Router();
  const authService = createAuthService({ jwtSecret });
  router.get('/health', health);
  router.use('/auth', createPublicAuthRouter(authService, rateLimitEnabled));
  router.use(createAuthMiddleware(authService));
  router.use('/auth', createPrivateAuthRouter(authService));
  router.use('/transactions', transactionRouter);
  router.use('/budgets', budgetRouter);
  router.use('/summary', summaryRouter);
  return router;
}
