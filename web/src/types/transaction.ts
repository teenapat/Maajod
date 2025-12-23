export type TransactionType = 'income' | 'expense';
export type ExpenseCategory = 'ingredients' | 'supplies' | 'utilities' | 'other';

export interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  category?: ExpenseCategory;
  note?: string;
  date: string;
  createdAt: string;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactions: Transaction[];
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  category?: ExpenseCategory;
  note?: string;
  date?: string;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredients: 'วัตถุดิบ',
  supplies: 'อุปกรณ์',
  utilities: 'ค่าน้ำ/ไฟ',
  other: 'อื่นๆ',
};

