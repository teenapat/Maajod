import { Types } from 'mongoose';
import { Transaction, ITransaction, TransactionType, ExpenseCategory } from '../models/transaction.model';

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
      date: data.date || new Date(),
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
    if (!Types.ObjectId.isValid(id)) return null;
    return Transaction.findById(new Types.ObjectId(id));
  }

  async delete(id: string, storeId: string): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(storeId)) {
      return null;
    }
    return Transaction.findOneAndDelete({
      _id: new Types.ObjectId(id),
      storeId: new Types.ObjectId(storeId),
    });
  }

  async aggregateByDateRange(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ type: TransactionType; total: number }[]> {
    const result = await Transaction.aggregate([
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

    return result.map((item: { _id: TransactionType; total: number }) => ({
      type: item._id,
      total: Number(item.total) || 0,
    }));
  }
}

export const transactionRepository = new TransactionRepository();
