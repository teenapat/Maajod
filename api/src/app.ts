import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import storeRoutes from './routes/store.routes';
import { authMiddleware, storeAccessMiddleware } from './middleware/auth.middleware';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins (adjust for production)
  credentials: true,
  exposedHeaders: ['x-store-id'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-store-id', 'X-Store-Id'],
}));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes - Store management (ไม่ต้องใช้ storeAccessMiddleware)
app.use('/api/stores', authMiddleware, storeRoutes);

// Protected routes - Transaction (ต้อง auth + store access)
app.use('/api', authMiddleware, storeAccessMiddleware, transactionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Maajod API is running 🍚' });
});

export default app;
