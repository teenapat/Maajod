import dotenv from 'dotenv';
import 'reflect-metadata';
dotenv.config();

import { randomUUID } from 'crypto';
import * as fs from 'fs';
import mongoose from 'mongoose';
import * as path from 'path';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maajod';

// MongoDB Schemas
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  role: String,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: true });

const StoreSchema = new mongoose.Schema({
  name: String,
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  storeId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  category: String,
  note: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: true });

const UserStoreSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  storeId: mongoose.Schema.Types.ObjectId,
  role: String,
  isDefault: Boolean,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: true });

const MongoUser = mongoose.model('User', UserSchema);
const MongoStore = mongoose.model('Store', StoreSchema);
const MongoTransaction = mongoose.model('Transaction', TransactionSchema);
const MongoUserStore = mongoose.model('UserStore', UserStoreSchema);

// Helper function to escape SQL strings
function escapeSql(str: string | null | undefined): string {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function formatDate(date: Date | undefined): string {
  if (!date) return 'NULL';
  // SQL Server datetime format: 'YYYY-MM-DD HH:MM:SS'
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `'${year}-${month}-${day} ${hours}:${minutes}:${seconds}'`;
}

function formatBit(value: boolean | null | undefined, defaultValue: boolean = false): string {
  return (value !== undefined && value !== null ? value : defaultValue) ? '1' : '0';
}

async function exportToSQL() {
  try {
    console.log('🚀 Starting MongoDB to SQL Export\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ID mappings
    const idMappings: {
      users: Map<string, string>;
      stores: Map<string, string>;
      transactions: Map<string, string>;
    } = {
      users: new Map(),
      stores: new Map(),
      transactions: new Map(),
    };

    const sqlStatements: string[] = [];
    sqlStatements.push('-- MongoDB to SQL Server Migration Script');
    sqlStatements.push('-- Generated automatically');
    sqlStatements.push(`-- Date: ${new Date().toISOString()}\n`);
    sqlStatements.push('-- USE maajod;');
    sqlStatements.push('-- GO\n');

    // Clear existing data
    sqlStatements.push('-- Clear existing data');
    sqlStatements.push('-- DELETE FROM transactions;');
    sqlStatements.push('-- DELETE FROM user_stores;');
    sqlStatements.push('-- DELETE FROM stores;');
    sqlStatements.push('-- DELETE FROM users;');
    sqlStatements.push('-- GO\n');

    // Export Users
    console.log('📦 Exporting Users...');
    const mongoUsers = await MongoUser.find().lean();
    sqlStatements.push('-- Users');
    
    for (const user of mongoUsers) {
      const newId = randomUUID();
      idMappings.users.set(user._id.toString(), newId);
      
      sqlStatements.push(
        `INSERT INTO users (id, username, password, name, role, createdAt, updatedAt) VALUES (` +
        `${escapeSql(newId)}, ` +
        `${escapeSql(user.username)}, ` +
        `${escapeSql(user.password)}, ` +
        `${escapeSql(user.name)}, ` +
        `${escapeSql(user.role || 'user')}, ` +
        `${formatDate(user.createdAt)}, ` +
        `${formatDate(user.updatedAt)}` +
        `);`
      );
    }
    sqlStatements.push('');
    console.log(`✅ Exported ${mongoUsers.length} users\n`);

    // Export Stores
    console.log('📦 Exporting Stores...');
    const mongoStores = await MongoStore.find().lean();
    sqlStatements.push('-- Stores');
    
    for (const store of mongoStores) {
      const newId = randomUUID();
      idMappings.stores.set(store._id.toString(), newId);
      
      sqlStatements.push(
        `INSERT INTO stores (id, name, description, isActive, createdAt, updatedAt) VALUES (` +
        `${escapeSql(newId)}, ` +
        `${escapeSql(store.name)}, ` +
        `${store.description ? escapeSql(store.description) : 'NULL'}, ` +
        `${formatBit(store.isActive, true)}, ` +
        `${formatDate(store.createdAt)}, ` +
        `${formatDate(store.updatedAt)}` +
        `);`
      );
    }
    sqlStatements.push('');
    console.log(`✅ Exported ${mongoStores.length} stores\n`);

    // Export UserStores
    console.log('📦 Exporting UserStores...');
    const mongoUserStores = await MongoUserStore.find().lean();
    sqlStatements.push('-- UserStores');
    
    let exportedUserStores = 0;
    for (const userStore of mongoUserStores) {
      if (!userStore.userId || !userStore.storeId) {
        console.log(`  ⚠ Skipping UserStore: missing userId or storeId`);
        continue;
      }
      const userId = idMappings.users.get(userStore.userId.toString());
      const storeId = idMappings.stores.get(userStore.storeId.toString());

      if (!userId || !storeId) {
        console.log(`  ⚠ Skipping UserStore: user or store not found`);
        continue;
      }

      sqlStatements.push(
        `INSERT INTO user_stores (userId, storeId, role, isDefault, createdAt, updatedAt) VALUES (` +
        `${escapeSql(userId)}, ` +
        `${escapeSql(storeId)}, ` +
        `${escapeSql(userStore.role || 'member')}, ` +
        `${formatBit(userStore.isDefault, false)}, ` +
        `${formatDate(userStore.createdAt)}, ` +
        `${formatDate(userStore.updatedAt)}` +
        `);`
      );
      exportedUserStores++;
    }
    sqlStatements.push('');
    console.log(`✅ Exported ${exportedUserStores} user-store relationships\n`);

    // Export Transactions
    console.log('📦 Exporting Transactions...');
    const mongoTransactions = await MongoTransaction.find().lean();
    sqlStatements.push('-- Transactions');
    
    let exportedTransactions = 0;
    for (const transaction of mongoTransactions) {
      if (!transaction.storeId) {
        console.log(`  ⚠ Skipping Transaction: missing storeId`);
        continue;
      }
      const storeId = idMappings.stores.get(transaction.storeId.toString());

      if (!storeId) {
        console.log(`  ⚠ Skipping Transaction: store not found`);
        continue;
      }

      const newId = randomUUID();
      idMappings.transactions.set(transaction._id.toString(), newId);

      sqlStatements.push(
        `INSERT INTO transactions (id, storeId, type, amount, category, note, date, createdAt, updatedAt) VALUES (` +
        `${escapeSql(newId)}, ` +
        `${escapeSql(storeId)}, ` +
        `${escapeSql(transaction.type)}, ` +
        `${transaction.amount}, ` +
        `${transaction.category ? escapeSql(transaction.category) : 'NULL'}, ` +
        `${transaction.note ? escapeSql(transaction.note) : 'NULL'}, ` +
        `${formatDate(transaction.date || transaction.createdAt)}, ` +
        `${formatDate(transaction.createdAt)}, ` +
        `${formatDate(transaction.updatedAt)}` +
        `);`
      );
      exportedTransactions++;
    }
    sqlStatements.push('');
    console.log(`✅ Exported ${exportedTransactions} transactions\n`);

    // Write to file
    const outputPath = path.join(__dirname, '../../mongodb-export.sql');
    fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf8');
    
    console.log(`\n🎉 Export completed successfully!`);
    console.log(`📄 SQL file saved to: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`  Users: ${mongoUsers.length}`);
    console.log(`  Stores: ${mongoStores.length}`);
    console.log(`  UserStores: ${exportedUserStores}`);
    console.log(`  Transactions: ${exportedTransactions}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

exportToSQL();

