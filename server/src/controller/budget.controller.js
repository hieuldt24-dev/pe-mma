import * as budgetService from '../service/budget.service.js';
import { sendResponse } from '../utils/response.js';

export async function get(req, res) {
  return sendResponse(res, {
    message: 'Lấy ngân sách thành công.',
    data: await budgetService.getBudget(req.userId, req.params.month),
  });
}

export async function update(req, res) {
  return sendResponse(res, {
    message: 'Lưu ngân sách thành công.',
    data: await budgetService.updateBudget(req.userId, req.params.month, req.body),
  });
}
