import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api', authMiddleware, transactionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Maajod API is running 🍚' });
});

export default app;
