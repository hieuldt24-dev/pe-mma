export function createAuthMiddleware(authService) {
  return async (req, _res, next) => {
    const session = await authService.authenticate(req.get('Authorization'));
    req.userId = session.userId;
    req.sessionId = session.sessionId;
    next();
  };
}
