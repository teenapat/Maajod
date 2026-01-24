import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to SQL Server
    await connectDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Maajod API running at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
