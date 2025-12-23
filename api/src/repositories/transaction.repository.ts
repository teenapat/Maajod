import { Transaction, ITransaction, TransactionType, ExpenseCategory } from '../models/transaction.model';

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  category?: ExpenseCategory;
  note?: string;
  date?: Date;
}

export class TransactionRepository {
  async create(data: CreateTransactionInput): Promise<ITransaction> {
    const transaction = new Transaction(data);
    return transaction.save();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ITransaction[]> {
    return Transaction.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1, createdAt: -1 });
  }

  async findById(id: string): Promise<ITransaction | null> {
    return Transaction.findById(id);
  }

  async delete(id: string): Promise<ITransaction | null> {
    return Transaction.findByIdAndDelete(id);
  }

  async aggregateByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<{ _id: TransactionType; total: number }[]> {
    return Transaction.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);
  }
}

export const transactionRepository = new TransactionRepository();
