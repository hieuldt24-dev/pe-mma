import { getSummary } from '../service/summary.service.js';
import { sendResponse } from '../utils/response.js';

export async function get(req, res) {
  return sendResponse(res, {
    message: 'Lấy thống kê tháng thành công.',
    data: await getSummary(req.userId, req.query.month),
  });
}
