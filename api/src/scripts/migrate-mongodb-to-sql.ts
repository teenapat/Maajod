import dotenv from 'dotenv';
import 'reflect-metadata';
dotenv.config();

import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Store } from '../models/store.model';
import { Transaction } from '../models/transaction.model';
import { UserStore } from '../models/user-store.model';
import { User } from '../models/user.model';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maajod';

// MongoDB Schemas (for reading data)
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

// ID mapping: MongoDB ObjectId -> SQL UUID
const idMappings: {
  users: Map<string, string>;
  stores: Map<string, string>;
  transactions: Map<string, string>;
} = {
  users: new Map(),
  stores: new Map(),
  transactions: new Map(),
};

// Migration DataSource (with synchronize disabled)
let migrationDataSource: DataSource | null = null;

async function migrateUsers() {
  console.log('📦 Migrating Users...');
  const mongoUsers = await MongoUser.find().lean();
  const userRepo = migrationDataSource!.getRepository(User);

  for (const mongoUser of mongoUsers) {
    const newId = randomUUID();
    idMappings.users.set(mongoUser._id.toString(), newId);

    const user = new User();
    user.id = newId;
    user.username = mongoUser.username || '';
    user.password = mongoUser.password || '';
    // รองรับภาษาไทย - ใช้ String() เพื่อแปลงเป็น UTF-8
    user.name = String(mongoUser.name || '');
    user.role = (mongoUser.role || 'user') as 'admin' | 'user';
    user.createdAt = mongoUser.createdAt || new Date();
    user.updatedAt = mongoUser.updatedAt || new Date();

    await userRepo.save(user);
    console.log(`  ✓ Migrated user: ${mongoUser.username} (${mongoUser._id} -> ${newId})`);
  }

  console.log(`✅ Migrated ${mongoUsers.length} users\n`);
}

async function migrateStores() {
  console.log('📦 Migrating Stores...');
  const mongoStores = await MongoStore.find().lean();
  const storeRepo = migrationDataSource!.getRepository(Store);

  for (const mongoStore of mongoStores) {
    const newId = randomUUID();
    idMappings.stores.set(mongoStore._id.toString(), newId);

    const store = new Store();
    store.id = newId;
    // รองรับภาษาไทย - ใช้ String() เพื่อแปลงเป็น UTF-8
    store.name = String(mongoStore.name || '');
    store.description = mongoStore.description ? String(mongoStore.description) : undefined;
    store.isActive = mongoStore.isActive !== false;
    store.createdAt = mongoStore.createdAt || new Date();
    store.updatedAt = mongoStore.updatedAt || new Date();

    await storeRepo.save(store);
    console.log(`  ✓ Migrated store: ${store.name} (${mongoStore._id} -> ${newId})`);
  }

  console.log(`✅ Migrated ${mongoStores.length} stores\n`);
}

async function migrateUserStores() {
  console.log('📦 Migrating UserStores...');
  const mongoUserStores = await MongoUserStore.find().lean();
  const userStoreRepo = migrationDataSource!.getRepository(UserStore);

  let migrated = 0;
  for (const mongoUserStore of mongoUserStores) {
    if (!mongoUserStore.userId || !mongoUserStore.storeId) {
      console.log(`  ⚠ Skipping UserStore: missing userId or storeId`);
      continue;
    }
    const userId = idMappings.users.get(mongoUserStore.userId.toString());
    const storeId = idMappings.stores.get(mongoUserStore.storeId.toString());

    if (!userId || !storeId) {
      console.log(`  ⚠ Skipping UserStore: user or store not found (userId: ${mongoUserStore.userId}, storeId: ${mongoUserStore.storeId})`);
      continue;
    }

    const userStore = new UserStore();
    userStore.userId = userId;
    userStore.storeId = storeId;
    userStore.role = (mongoUserStore.role || 'member') as 'owner' | 'admin' | 'member';
    userStore.isDefault = mongoUserStore.isDefault || false;
    userStore.createdAt = mongoUserStore.createdAt || new Date();
    userStore.updatedAt = mongoUserStore.updatedAt || new Date();

    await userStoreRepo.save(userStore);
    migrated++;
  }

  console.log(`✅ Migrated ${migrated} user-store relationships\n`);
}

async function migrateTransactions() {
  console.log('📦 Migrating Transactions...');
  const mongoTransactions = await MongoTransaction.find().lean();
  const transactionRepo = migrationDataSource!.getRepository(Transaction);

  let migrated = 0;
  for (const mongoTransaction of mongoTransactions) {
    if (!mongoTransaction.storeId) {
      console.log(`  ⚠ Skipping Transaction: missing storeId`);
      continue;
    }
    const storeId = idMappings.stores.get(mongoTransaction.storeId.toString());

    if (!storeId) {
      console.log(`  ⚠ Skipping Transaction: store not found (storeId: ${mongoTransaction.storeId})`);
      continue;
    }

    const newId = randomUUID();
    idMappings.transactions.set(mongoTransaction._id.toString(), newId);

    const transaction = new Transaction();
    transaction.id = newId;
    transaction.storeId = storeId;
    transaction.type = mongoTransaction.type as 'income' | 'expense';
    transaction.amount = mongoTransaction.amount || 0;
    transaction.category = (mongoTransaction.category as 'ingredients' | 'supplies' | 'utilities' | 'other' | undefined) || undefined;
    // รองรับภาษาไทย - ใช้ String() เพื่อแปลงเป็น UTF-8
    transaction.note = mongoTransaction.note ? String(mongoTransaction.note) : undefined;
    transaction.date = mongoTransaction.date || mongoTransaction.createdAt || new Date();
    transaction.createdAt = mongoTransaction.createdAt || new Date();
    transaction.updatedAt = mongoTransaction.updatedAt || new Date();

    await transactionRepo.save(transaction);
    migrated++;
  }

  console.log(`✅ Migrated ${migrated} transactions\n`);
}

async function main() {
  try {
    console.log('🚀 Starting MongoDB to SQL Server Migration\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Connect to SQL Server
    console.log('🔌 Connecting to SQL Server...');
    // สร้าง DataSource ใหม่สำหรับ migration
    // เปิด synchronize ชั่วคราวเพื่อสร้าง tables (ถ้ายังไม่มี)
    migrationDataSource = new DataSource({
      ...AppDataSource.options,
      synchronize: true, // เปิด synchronize เพื่อสร้าง tables
    });
    
    await migrationDataSource.initialize();
    console.log('✅ Connected to SQL Server\n');
    
    // ปิด synchronize หลังจาก initialize เพื่อหลีกเลี่ยง deadlock ระหว่าง migration
    // Note: synchronize เป็น read-only แต่เราสามารถสร้าง DataSource ใหม่ได้
    // แต่เนื่องจาก tables ถูกสร้างแล้ว เราจะใช้ DataSource เดิมต่อไป

    // Clear existing data (optional - comment out if you want to keep existing data)
    // Must delete in order: Transactions -> UserStores -> Stores -> Users (due to foreign keys)
    console.log('🗑️  Clearing existing SQL Server data...');
    
    // ตรวจสอบว่า tables มีอยู่หรือไม่ก่อนลบ
    const queryRunner = migrationDataSource!.createQueryRunner();
    await queryRunner.connect();
    
    try {
      // ตรวจสอบว่า table มีอยู่หรือไม่
      const tablesExist = await queryRunner.hasTable('transactions') || 
                          await queryRunner.hasTable('user_stores') ||
                          await queryRunner.hasTable('stores') ||
                          await queryRunner.hasTable('users');
      
      if (tablesExist) {
        // Retry logic สำหรับ deadlock
        let retries = 3;
        while (retries > 0) {
          try {
            if (await queryRunner.hasTable('transactions')) {
              await migrationDataSource!.getRepository(Transaction).createQueryBuilder().delete().execute();
            }
            if (await queryRunner.hasTable('user_stores')) {
              await migrationDataSource!.getRepository(UserStore).createQueryBuilder().delete().execute();
            }
            if (await queryRunner.hasTable('stores')) {
              await migrationDataSource!.getRepository(Store).createQueryBuilder().delete().execute();
            }
            if (await queryRunner.hasTable('users')) {
              await migrationDataSource!.getRepository(User).createQueryBuilder().delete().execute();
            }
            console.log('✅ Cleared existing data\n');
            break;
          } catch (error: any) {
            if (error.code === 'EREQUEST' && error.number === 1205 && retries > 1) {
              // Deadlock - retry
              retries--;
              console.log(`⚠️  Deadlock detected, retrying... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            } else {
              throw error;
            }
          }
        }
      } else {
        console.log('ℹ️  Tables do not exist yet, skipping data clearing\n');
      }
    } finally {
      await queryRunner.release();
    }

    // Migrate in order: Users -> Stores -> UserStores -> Transactions
    await migrateUsers();
    await migrateStores();
    await migrateUserStores();
    await migrateTransactions();

    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  Users: ${idMappings.users.size}`);
    console.log(`  Stores: ${idMappings.stores.size}`);
    console.log(`  Transactions: ${idMappings.transactions.size}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    await mongoose.connection.close();
    if (migrationDataSource?.isInitialized) {
      await migrationDataSource.destroy();
    }
    process.exit(0);
  }
}

main();

