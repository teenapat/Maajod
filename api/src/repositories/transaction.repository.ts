import { AppDataSource } from '../config/database';
import { Transaction, TransactionType } from '../models/transaction.model';
import { Repository } from 'typeorm';

export interface CreateTransactionInput {
  storeId: string;
  type: TransactionType;
  amount: number;
  category?: string;
  note?: string;
  date?: Date;
}

export class TransactionRepository {
  private transactionRepository: Repository<Transaction>;

  constructor() {
    this.transactionRepository = AppDataSource.getRepository(Transaction);
  }

  async create(data: CreateTransactionInput): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      ...data,
      date: data.date || new Date(),
    });
    return this.transactionRepository.save(transaction);
  }

  async findByDateRange(storeId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.storeId = :storeId', { storeId })
      .andWhere('transaction.date >= :startDate', { startDate })
      .andWhere('transaction.date <= :endDate', { endDate })
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id },
    });
  }

  async delete(id: string, storeId: string): Promise<Transaction | null> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, storeId },
    });
    if (!transaction) return null;

    await this.transactionRepository.remove(transaction);
    return transaction;
  }

  async aggregateByDateRange(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ type: TransactionType; total: number }[]> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.type', 'type')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.storeId = :storeId', { storeId })
      .andWhere('transaction.date >= :startDate', { startDate })
      .andWhere('transaction.date <= :endDate', { endDate })
      .groupBy('transaction.type')
      .getRawMany();

    return result.map((item) => ({
      type: item.type as TransactionType,
      total: parseFloat(item.total) || 0,
    }));
  }
}

export const transactionRepository = new TransactionRepository();
