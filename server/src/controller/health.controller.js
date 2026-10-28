import { isDatabaseConnected } from '../config/database.js';
import { sendResponse } from '../utils/response.js';

export function get(_req, res) {
  const connected = isDatabaseConnected();
  return sendResponse(res, {
    status: connected ? 200 : 503,
    message: connected ? 'Dịch vụ đang hoạt động.' : 'Không kết nối được database.',
    data: { database: connected ? 'connected' : 'disconnected' },
  });
}
