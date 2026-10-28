import { Transaction } from '../model/transaction.model.js';
import { Budget } from '../model/budget.model.js';
import { monthValue } from './validation.js';

export async function getSummary(userId, monthInput) {
  const month = monthValue(monthInput);
  const [totals, byCategory, budget] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, date: { $regex: `^${month}-` } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $regex: `^${month}-` } } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } },
      { $sort: { amount: -1, _id: 1 } },
    ]),
    Budget.findOne({ userId, month }),
  ]);
  const income = totals.find((row) => row._id === 'income')?.total ?? 0;
  const expense = totals.find((row) => row._id === 'expense')?.total ?? 0;
  return {
    month,
    income,
    expense,
    balance: income - expense,
    count: totals.reduce((sum, row) => sum + row.count, 0),
    budget: budget?.limit ?? null,
    categories: byCategory.map((row) => ({ category: row._id, amount: row.amount })),
  };
}
