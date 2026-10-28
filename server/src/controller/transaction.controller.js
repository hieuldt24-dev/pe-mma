import * as transactionService from '../service/transaction.service.js';
import { sendResponse } from '../utils/response.js';

export async function list(req, res) {
  return sendResponse(res, {
    message: 'Lấy danh sách giao dịch thành công.',
    data: await transactionService.listTransactions(req.userId, req.query),
  });
}

export async function create(req, res) {
  return sendResponse(res, {
    status: 201,
    message: 'Thêm giao dịch thành công.',
    data: await transactionService.createTransaction(req.userId, req.body ?? {}),
  });
}

export async function get(req, res) {
  return sendResponse(res, {
    message: 'Lấy chi tiết giao dịch thành công.',
    data: await transactionService.getTransaction(req.userId, req.params.id),
  });
}

export async function update(req, res) {
  return sendResponse(res, {
    message: 'Cập nhật giao dịch thành công.',
    data: await transactionService.updateTransaction(req.userId, req.params.id, req.body ?? {}),
  });
}

export async function remove(req, res) {
  await transactionService.deleteTransaction(req.userId, req.params.id);
  return sendResponse(res, { message: 'Xóa giao dịch thành công.' });
}
