import { Transaction } from '../model/transaction.model.js';
import { transactionDto } from './dto.js';
import { fail, transactionInput, monthValue, categories } from './validation.js';

export async function listTransactions(userId, query) {
  const filter = { userId };
  if (query.month) filter.date = { $regex: `^${monthValue(query.month)}-` };
  if (query.type) {
    if (!['income', 'expense'].includes(query.type)) fail('Bộ lọc loại giao dịch không hợp lệ.');
    filter.type = query.type;
  }
  if (query.category) {
    if (![...categories.income, ...categories.expense].includes(query.category))
      fail('Danh mục không hợp lệ.');
    filter.category = query.category;
  }
  if (query.q) {
    if (typeof query.q !== 'string' || query.q.length > 100)
      fail('Từ khóa tìm kiếm tối đa 100 ký tự.');
    const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { note: { $regex: escaped, $options: 'i' } },
      { category: { $regex: escaped, $options: 'i' } },
    ];
  }
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 50
  )
    fail('Phân trang không hợp lệ.');
  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);
  return { items: items.map(transactionDto), total, page, limit, pages: Math.ceil(total / limit) };
}

export async function createTransaction(userId, body) {
  const item = await Transaction.create({ ...transactionInput(body), userId });
  return { transaction: transactionDto(item) };
}

export async function getTransaction(userId, id) {
  const item = await Transaction.findOne({ _id: id, userId });
  if (!item) fail('Không tìm thấy giao dịch.', 404);
  return { transaction: transactionDto(item) };
}

export async function updateTransaction(userId, id, body) {
  const input = transactionInput(body);
  const item = await Transaction.findOneAndUpdate(
    { _id: id, userId },
    { $set: input },
    { returnDocument: 'after', runValidators: true },
  );
  if (!item) fail('Không tìm thấy giao dịch.', 404);
  return { transaction: transactionDto(item) };
}

export async function deleteTransaction(userId, id) {
  const item = await Transaction.findOneAndDelete({ _id: id, userId });
  if (!item) fail('Không tìm thấy giao dịch.', 404);
}
