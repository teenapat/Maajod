import {
  transactionRepository,
  CreateTransactionInput,
} from '../repositories/transaction.repository';
import { Transaction } from '../models/transaction.model';
import { getDayRange, getMonthRange } from '../utils/date';

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactions: Transaction[];
}

export class TransactionService {
  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    // Validate storeId
    if (!data.storeId) {
      throw new Error('Store ID is required');
    }

    // Validate expense must have category
    if (data.type === 'expense' && !data.category) {
      throw new Error('Category is required for expense');
    }

    // If no date provided, use today
    if (!data.date) {
      data.date = new Date();
    }

    return transactionRepository.create(data);
  }

  async getTransactionsByDateRange(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    return transactionRepository.findByDateRange(storeId, startDate, endDate);
  }

  async getDailySummary(storeId: string, date: Date): Promise<Summary> {
    const { start, end } = getDayRange(date);
    return this.getSummary(storeId, start, end);
  }

  async getMonthlySummary(storeId: string, year: number, month: number): Promise<Summary> {
    const { start, end } = getMonthRange(year, month);
    return this.getSummary(storeId, start, end);
  }

  private async getSummary(storeId: string, startDate: Date, endDate: Date): Promise<Summary> {
    const [aggregated, transactions] = await Promise.all([
      transactionRepository.aggregateByDateRange(storeId, startDate, endDate),
      transactionRepository.findByDateRange(storeId, startDate, endDate),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const item of aggregated) {
      if (item.type === 'income') {
        totalIncome = item.total;
      } else if (item.type === 'expense') {
        totalExpense = item.total;
      }
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      transactions,
    };
  }

  async deleteTransaction(id: string, storeId: string): Promise<Transaction | null> {
    return transactionRepository.delete(id, storeId);
  }
}

export const transactionService = new TransactionService();
