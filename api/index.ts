import type { IncomingMessage, ServerResponse } from 'http';
import app from './src/app';
import { connectDatabase } from './src/config/database';

// Serverless entry สำหรับ Vercel
// เชื่อม MongoDB ครั้งเดียวแล้ว reuse connection ข้าม invocation (cold start)
let dbReady: Promise<void> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!dbReady) {
    dbReady = connectDatabase();
  }
  await dbReady;

  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
