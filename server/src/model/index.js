import { User } from './user.model.js';
import { Session } from './session.model.js';
import { Transaction } from './transaction.model.js';
import { Budget } from './budget.model.js';

export { User, Session, Transaction, Budget };

export async function initializeModels() {
  for (const Model of [User, Session, Transaction, Budget]) {
    await Model.createCollection();
    await Model.createIndexes();
  }
}
