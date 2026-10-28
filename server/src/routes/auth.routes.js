import { Router } from 'express';
import { createAuthController } from '../controller/auth.controller.js';
import { createAuthLimiter } from '../middleware/rate-limit.middleware.js';

export function createPublicAuthRouter(authService, rateLimitEnabled) {
  const router = Router();
  const controller = createAuthController(authService);
  const authLimit = createAuthLimiter(rateLimitEnabled);
  router.post('/register', authLimit, controller.register);
  router.post('/login', authLimit, controller.login);
  return router;
}

export function createPrivateAuthRouter(authService) {
  const router = Router();
  const controller = createAuthController(authService);
  router.get('/me', controller.me);
  router.post('/logout', controller.logout);
  return router;
}
