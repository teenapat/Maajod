import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserStore } from '../models/user-store.model';

const JWT_SECRET = process.env.JWT_SECRET || 'maajod-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
  storeId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

// Middleware สำหรับ verify ว่า user มีสิทธิ์เข้าถึง store ที่ระบุ
export async function storeAccessMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // รับ storeId จาก header หรือ query
    const storeId = req.headers['x-store-id'] as string || req.query.storeId as string;

    if (!storeId) {
      res.status(400).json({ error: 'กรุณาระบุร้านค้า (storeId)' });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
      return;
    }

    // ตรวจสอบว่า user มีสิทธิ์เข้าถึง store นี้หรือไม่
    const userStore = await UserStore.findOne({
      userId: req.user.id,
      storeId: storeId,
    });

    if (!userStore) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงร้านค้านี้' });
      return;
    }

    req.storeId = storeId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
  }
}

export function generateToken(user: { id: string; username: string; name: string; role: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}
