import { Budget } from '../model/budget.model.js';
import { monthValue, money } from './validation.js';

export async function getBudget(userId, monthInput) {
  const month = monthValue(monthInput);
  const budget = await Budget.findOne({ userId, month });
  return { month, limit: budget?.limit ?? null };
}

export async function updateBudget(userId, monthInput, body) {
  const month = monthValue(monthInput);
  const limit = money(body?.limit);
  await Budget.findOneAndUpdate(
    { userId, month },
    { $set: { limit } },
    { upsert: true, runValidators: true },
  );
  return { month, limit };
}
