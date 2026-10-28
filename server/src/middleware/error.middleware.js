import { fail } from '../service/validation.js';
import { sendResponse } from '../utils/response.js';

export function notFound(_req, _res) {
  fail('Không tìm thấy endpoint.', 404);
}

export function errorHandler(error, _req, res, _next) {
  if (error.code === 11000)
    return sendResponse(res, {
      status: 409,
      message:
        'Thông tin đã tồn tại. Email có thể đã được đăng ký; vui lòng tải lại nếu đang cập nhật ngân sách.',
    });
  if (error.type === 'entity.parse.failed')
    return sendResponse(res, { status: 400, message: 'JSON không hợp lệ.' });
  if (error.name === 'ValidationError')
    return sendResponse(res, { status: 400, message: 'Dữ liệu không hợp lệ.' });
  if (error.status && error.status < 500)
    return sendResponse(res, { status: error.status, message: error.message });
  console.error('[API error]', error.name);
  return sendResponse(res, {
    status: 503,
    message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại.',
  });
}
