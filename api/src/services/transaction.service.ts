import {
  transactionRepository,
  CreateTransactionInput,
} from '../repositories/transaction.repository';
import { ITransaction } from '../models/transaction.model';
import { getDayRange, getMonthRange } from '../utils/date';

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactions: ITransaction[];
}

export class TransactionService {
  async createTransaction(data: CreateTransactionInput): Promise<ITransaction> {
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
    startDate: Date,
    endDate: Date
  ): Promise<ITransaction[]> {
    return transactionRepository.findByDateRange(startDate, endDate);
  }

  async getDailySummary(date: Date): Promise<Summary> {
    const { start, end } = getDayRange(date);
    return this.getSummary(start, end);
  }

  async getMonthlySummary(year: number, month: number): Promise<Summary> {
    const { start, end } = getMonthRange(year, month);
    return this.getSummary(start, end);
  }

  private async getSummary(startDate: Date, endDate: Date): Promise<Summary> {
    const [aggregated, transactions] = await Promise.all([
      transactionRepository.aggregateByDateRange(startDate, endDate),
      transactionRepository.findByDateRange(startDate, endDate),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const item of aggregated) {
      if (item._id === 'income') {
        totalIncome = item.total;
      } else if (item._id === 'expense') {
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

  async deleteTransaction(id: string): Promise<ITransaction | null> {
    return transactionRepository.delete(id);
  }
}

export const transactionService = new TransactionService();
