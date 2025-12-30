import { Response } from 'express';
import { transactionService } from '../services/transaction.service';
import { parseDate } from '../utils/date';
import { AuthRequest } from '../middleware/auth.middleware';

export class TransactionController {
  // POST /api/transactions
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type, amount, category, note, date } = req.body;

      if (!type || !amount) {
        res.status(400).json({ error: 'type and amount are required' });
        return;
      }

      if (!req.storeId) {
        res.status(400).json({ error: 'Store ID is required' });
        return;
      }

      const transaction = await transactionService.createTransaction({
        storeId: req.storeId,
        type,
        amount: Number(amount),
        category,
        note,
        date: date ? parseDate(date) : undefined,
      });

      res.status(201).json(transaction);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // GET /api/transactions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  async getByDateRange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      if (!req.storeId) {
        res.status(400).json({ error: 'Store ID is required' });
        return;
      }

      const transactions = await transactionService.getTransactionsByDateRange(
        req.storeId,
        parseDate(startDate as string),
        parseDate(endDate as string)
      );

      res.json(transactions);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // GET /api/summary/daily?date=YYYY-MM-DD
  async getDailySummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { date } = req.query;

      if (!req.storeId) {
        res.status(400).json({ error: 'Store ID is required' });
        return;
      }

      const targetDate = date ? parseDate(date as string) : new Date();
      const summary = await transactionService.getDailySummary(req.storeId, targetDate);

      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // GET /api/summary/monthly?year=YYYY&month=MM
  async getMonthlySummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { year, month } = req.query;

      if (!req.storeId) {
        res.status(400).json({ error: 'Store ID is required' });
        return;
      }

      const now = new Date();
      const targetYear = year ? Number(year) : now.getFullYear();
      const targetMonth = month ? Number(month) : now.getMonth() + 1;

      if (targetMonth < 1 || targetMonth > 12) {
        res.status(400).json({ error: 'Month must be between 1 and 12' });
        return;
      }

      const summary = await transactionService.getMonthlySummary(req.storeId, targetYear, targetMonth);

      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // DELETE /api/transactions/:id
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.storeId) {
        res.status(400).json({ error: 'Store ID is required' });
        return;
      }

      const transaction = await transactionService.deleteTransaction(id, req.storeId);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.json({ message: 'Deleted successfully', transaction });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}

export const transactionController = new TransactionController();
