import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';

const router = Router();

// Transaction CRUD
router.post('/transactions', (req, res) => transactionController.create(req, res));
router.get('/transactions', (req, res) => transactionController.getByDateRange(req, res));
router.delete('/transactions/:id', (req, res) => transactionController.delete(req, res));

// Summary
router.get('/summary/daily', (req, res) => transactionController.getDailySummary(req, res));
router.get('/summary/monthly', (req, res) => transactionController.getMonthlySummary(req, res));

export default router;

