import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AuthRequest, generateToken } from '../middleware/auth.middleware';
import { User } from '../models/user.model';
import { storeService } from '../services/store.service';

export class AuthController {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'กรุณาใส่ username และ password' });
        return;
      }

      const user = await this.userRepository.findOne({
        where: { username: username.toLowerCase() },
      });

      if (!user) {
        res.status(401).json({ error: 'username หรือ password ไม่ถูกต้อง' });
        return;
      }

      const isValid = await user.comparePassword(password);

      if (!isValid) {
        res.status(401).json({ error: 'username หรือ password ไม่ถูกต้อง' });
        return;
      }

      // ดึงร้านทั้งหมดของ user
      const stores = await storeService.getStoresByUserId(user.id);
      
      // หา default store หรือใช้ store แรก
      const defaultStore = stores.find(s => s.isDefault) || stores[0];
      const defaultStoreId = defaultStore?.id || null;

      const token = generateToken({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
        stores,
        defaultStoreId, // เพิ่ม defaultStoreId เพื่อให้ frontend ใช้
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }

  // POST /api/auth/register (สำหรับสร้าง user ใหม่)
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, name, role } = req.body;

      if (!username || !password || !name) {
        res.status(400).json({ error: 'กรุณาใส่ username, password และ name' });
        return;
      }

      // เช็คว่า username ซ้ำไหม
      const existingUser = await this.userRepository.findOne({
        where: { username: username.toLowerCase() },
      });
      if (existingUser) {
        res.status(400).json({ error: 'username นี้ถูกใช้แล้ว' });
        return;
      }

      const user = this.userRepository.create({
        username: username.toLowerCase(),
        password,
        name,
        role: role || 'user',
      });

      const savedUser = await this.userRepository.save(user);

      res.status(201).json({
        message: 'สร้างผู้ใช้สำเร็จ',
        user: {
          id: savedUser.id,
          username: savedUser.username,
          name: savedUser.name,
          role: savedUser.role,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }

  // GET /api/auth/me
  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      // ดึงร้านทั้งหมดของ user
      const stores = await storeService.getStoresByUserId(req.user.id);
      
      // หา default store หรือใช้ store แรก
      const defaultStore = stores.find(s => s.isDefault) || stores[0];
      const defaultStoreId = defaultStore?.id || null;

      res.json({
        user: req.user,
        stores,
        defaultStoreId, // เพิ่ม defaultStoreId เพื่อให้ frontend ใช้
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}

export const authController = new AuthController();
