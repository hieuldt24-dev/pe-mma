import { sendResponse } from '../utils/response.js';

export function createAuthController(authService) {
  return {
    async register(req, res) {
      return sendResponse(res, {
        status: 201,
        message: 'Đăng ký thành công.',
        data: await authService.register(req.body ?? {}),
      });
    },
    async login(req, res) {
      return sendResponse(res, {
        message: 'Đăng nhập thành công.',
        data: await authService.login(req.body ?? {}),
      });
    },
    async me(req, res) {
      return sendResponse(res, {
        message: 'Lấy thông tin tài khoản thành công.',
        data: await authService.getCurrentUser(req.userId),
      });
    },
    async logout(req, res) {
      await authService.logout(req.userId, req.sessionId);
      return sendResponse(res, { message: 'Đăng xuất thành công.' });
    },
  };
}
