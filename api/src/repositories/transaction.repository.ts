import { Transaction, ITransaction, TransactionType, ExpenseCategory } from '../models/transaction.model';
import { Types } from 'mongoose';

export interface CreateTransactionInput {
  storeId: string;
  type: TransactionType;
  amount: number;
  category?: ExpenseCategory;
  note?: string;
  date?: Date;
}

export class TransactionRepository {
  async create(data: CreateTransactionInput): Promise<ITransaction> {
    const transaction = new Transaction({
      ...data,
      storeId: new Types.ObjectId(data.storeId),
    });
    return transaction.save();
  }

  async findByDateRange(storeId: string, startDate: Date, endDate: Date): Promise<ITransaction[]> {
    return Transaction.find({
      storeId: new Types.ObjectId(storeId),
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1, createdAt: -1 });
  }

  async findById(id: string): Promise<ITransaction | null> {
    return Transaction.findById(id);
  }

  async delete(id: string, storeId: string): Promise<ITransaction | null> {
    return Transaction.findOneAndDelete({
      _id: new Types.ObjectId(id),
      storeId: new Types.ObjectId(storeId),
    });
  }

  async aggregateByDateRange(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ _id: TransactionType; total: number }[]> {
    return Transaction.aggregate([
      {
        $match: {
          storeId: new Types.ObjectId(storeId),
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
