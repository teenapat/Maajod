import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { generateToken, AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'กรุณาใส่ username และ password' });
        return;
      }

      const user = await User.findOne({ username: username.toLowerCase() });

      if (!user) {
        res.status(401).json({ error: 'username หรือ password ไม่ถูกต้อง' });
        return;
      }

      const isValid = await user.comparePassword(password);

      if (!isValid) {
        res.status(401).json({ error: 'username หรือ password ไม่ถูกต้อง' });
        return;
      }

      const token = generateToken({
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
      });

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
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
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        res.status(400).json({ error: 'username นี้ถูกใช้แล้ว' });
        return;
      }

      const user = new User({
        username: username.toLowerCase(),
        password,
        name,
        role: role || 'user',
      });

      await user.save();

      res.status(201).json({
        message: 'สร้างผู้ใช้สำเร็จ',
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }

  // GET /api/auth/me
  async me(req: AuthRequest, res: Response): Promise<void> {
    res.json({ user: req.user });
  }
}

export const authController = new AuthController();
