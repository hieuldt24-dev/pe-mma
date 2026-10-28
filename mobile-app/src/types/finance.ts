export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note?: string;
}

export type TransactionInput = Omit<Transaction, 'id' | 'userId'>;
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface AuthResult {
  token: string;
  user: User;
  expiresAt: string;
}
export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
export interface Summary {
  month: string;
  income: number;
  expense: number;
  balance: number;
  count: number;
  budget: number | null;
  categories: { category: string; amount: number }[];
}
