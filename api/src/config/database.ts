import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Store } from '../models/store.model';
import { Transaction } from '../models/transaction.model';
import { UserStore } from '../models/user-store.model';
import { User } from '../models/user.model';

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  entities: [User, Store, Transaction, UserStore],
  synchronize: true, // ใช้ true สำหรับ development, ใช้ migrations สำหรับ production
  logging: false,
});

export async function connectDatabase(): Promise<void> {
  try {
    console.log('🔌 Connecting to SQL Server...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('✅ Connected to SQL Server');
  } catch (error) {
    console.error('❌ SQL Server connection error:', error);
    throw error;
  }
}

export default { connectDatabase, AppDataSource };
