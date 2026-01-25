import dotenv from 'dotenv';
import 'reflect-metadata';
dotenv.config();

import { DataSource } from 'typeorm';

export const dataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true },
  entities: [],
  synchronize: false,
  logging: false,
});

async function testConnection() {
  try {
    console.log('🔍 Testing SQL Server Connection with TypeORM');
    console.log('📋 Config:');
    console.log('   Host:', process.env.DB_HOST);
    console.log('   Port:', process.env.DB_PORT);
    console.log('   Database:', process.env.DB_NAME);
    console.log('   Username:', process.env.DB_USER);
    console.log('');

    console.log('🚀 Initializing connection...');
    await dataSource.initialize();
    
    console.log('✅ Connection successful!');
    console.log('📊 Database:', dataSource.options.database);
    
    // ทดสอบ query
    console.log('');
    console.log('🧪 Testing query...');
    const result = await dataSource.query('SELECT @@VERSION as version');
    console.log('✅ Query successful!');
    console.log('📄 SQL Server Version:', result[0]?.version?.substring(0, 50) + '...');
    
    await dataSource.destroy();
    console.log('');
    console.log('🎉 All tests passed!');
    process.exit(0);
  } catch (error: any) {
    console.error('');
    console.error('❌ Connection failed!');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    if (error.originalError) {
      console.error('   Original Error:', error.originalError.message);
    }
    process.exit(1);
  }
}

testConnection();
