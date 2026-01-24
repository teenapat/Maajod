import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
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
    // รับ storeId จาก header หรือ query (รองรับหลายรูปแบบ)
    let storeId: string | undefined = 
      (req.headers['x-store-id'] as string) ||
      (req.headers['X-Store-Id'] as string) ||
      (req.query.storeId as string);

    // กรอง "undefined" string ออก
    if (storeId === 'undefined' || storeId === 'null' || !storeId || storeId.trim() === '') {
      storeId = undefined;
    }

    // ถ้าไม่มี storeId และมี user ให้ลองหา default store
    if (!storeId && req.user?.id) {
      try {
        const { storeService } = await import('../services/store.service');
        const defaultUserStore = await storeService.getDefaultStore(req.user.id);
        if (defaultUserStore) {
          storeId = defaultUserStore.storeId;
          console.log(`✅ Using default store: ${storeId} for user ${req.user.id}`);
        } else {
          // ถ้าไม่มี default store ให้ลองใช้ store แรก
          const stores = await storeService.getStoresByUserId(req.user.id);
          if (stores.length > 0) {
            storeId = stores[0].id;
            console.log(`✅ Using first store: ${storeId} for user ${req.user.id}`);
          }
        }
      } catch (error) {
        console.error('Error getting default store:', error);
      }
    }

    if (!storeId) {
      // Debug: แสดง headers ที่มี
      console.log('🔍 Debug - Headers:', Object.keys(req.headers).filter(k => k.toLowerCase().includes('store')));
      console.log('🔍 Debug - Query:', req.query);
      res.status(400).json({ 
        error: 'กรุณาระบุร้านค้า (storeId)',
        hint: 'ส่ง header "x-store-id" หรือ query parameter "storeId" หรือตั้งค่า default store'
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
      return;
    }

    // ตรวจสอบว่า user มีสิทธิ์เข้าถึง store นี้หรือไม่
    const userStoreRepository = AppDataSource.getRepository(UserStore);
    const userStore = await userStoreRepository.findOne({
      where: {
        userId: req.user.id,
        storeId: storeId,
      },
    });

    if (!userStore) {
      console.log(`⚠️  Access denied - User ${req.user.id} tried to access store ${storeId}`);
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงร้านค้านี้' });
      return;
    }

    req.storeId = storeId;
    next();
  } catch (error) {
    console.error('❌ storeAccessMiddleware error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์', details: message });
  }
}

export function generateToken(user: { id: string; username: string; name: string; role: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}
