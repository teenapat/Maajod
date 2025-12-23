import { Request, Response } from 'express';
import { transactionService } from '../services/transaction.service';
import { parseDate } from '../utils/date';

export class TransactionController {
  // POST /api/transactions
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { type, amount, category, note, date } = req.body;

      if (!type || !amount) {
        res.status(400).json({ error: 'type and amount are required' });
        return;
      }

      const transaction = await transactionService.createTransaction({
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
  async getByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const transactions = await transactionService.getTransactionsByDateRange(
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
  async getDailySummary(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.query;

      const targetDate = date ? parseDate(date as string) : new Date();
      const summary = await transactionService.getDailySummary(targetDate);

      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // GET /api/summary/monthly?year=YYYY&month=MM
  async getMonthlySummary(req: Request, res: Response): Promise<void> {
    try {
      const { year, month } = req.query;

      const now = new Date();
      const targetYear = year ? Number(year) : now.getFullYear();
      const targetMonth = month ? Number(month) : now.getMonth() + 1;

      if (targetMonth < 1 || targetMonth > 12) {
        res.status(400).json({ error: 'Month must be between 1 and 12' });
        return;
      }

      const summary = await transactionService.getMonthlySummary(targetYear, targetMonth);

      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // DELETE /api/transactions/:id
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await transactionService.deleteTransaction(id);

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
