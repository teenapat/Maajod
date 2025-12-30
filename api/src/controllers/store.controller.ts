import { Response } from 'express';
import { storeService } from '../services/store.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class StoreController {
  // POST /api/stores - สร้างร้านใหม่
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({ error: 'กรุณาระบุชื่อร้าน' });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      const { store, userStore } = await storeService.createStore(
        { name, description },
        req.user.id
      );

      res.status(201).json({ store, userStore });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // GET /api/stores - ดึงร้านทั้งหมดของ user
  async getMyStores(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      const stores = await storeService.getStoresByUserId(req.user.id);
      res.json(stores);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // GET /api/stores/:id - ดึงข้อมูลร้าน
  async getStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      // ตรวจสอบสิทธิ์
      const access = await storeService.checkUserAccess(req.user.id, id);
      if (!access) {
        res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงร้านค้านี้' });
        return;
      }

      const store = await storeService.getStoreById(id);
      if (!store) {
        res.status(404).json({ error: 'ไม่พบร้านค้า' });
        return;
      }

      res.json({ ...store.toObject(), userRole: access.role });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // PUT /api/stores/:id - อัพเดทข้อมูลร้าน
  async updateStore(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      // ตรวจสอบสิทธิ์ (ต้องเป็น owner หรือ admin)
      const access = await storeService.checkUserAccess(req.user.id, id);
      if (!access || (access.role !== 'owner' && access.role !== 'admin')) {
        res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขร้านค้านี้' });
        return;
      }

      const store = await storeService.updateStore(id, { name, description });
      res.json(store);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // POST /api/stores/:id/users - เพิ่ม user เข้าร้าน
  async addUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role = 'member' } = req.body;

      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      // ตรวจสอบสิทธิ์ (ต้องเป็น owner หรือ admin)
      const access = await storeService.checkUserAccess(req.user.id, id);
      if (!access || (access.role !== 'owner' && access.role !== 'admin')) {
        res.status(403).json({ error: 'คุณไม่มีสิทธิ์เพิ่ม user ในร้านค้านี้' });
        return;
      }

      const userStore = await storeService.addUserToStore(id, userId, role);
      res.status(201).json(userStore);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // DELETE /api/stores/:id/users/:userId - ลบ user ออกจากร้าน
  async removeUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;

      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      // ตรวจสอบสิทธิ์ (ต้องเป็น owner)
      const access = await storeService.checkUserAccess(req.user.id, id);
      if (!access || access.role !== 'owner') {
        res.status(403).json({ error: 'เฉพาะเจ้าของร้านเท่านั้นที่ลบ user ได้' });
        return;
      }

      const result = await storeService.removeUserFromStore(id, userId);
      if (!result) {
        res.status(404).json({ error: 'ไม่พบ user ในร้านค้านี้' });
        return;
      }

      res.json({ message: 'ลบ user สำเร็จ' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // GET /api/stores/:id/users - ดึง users ทั้งหมดในร้าน
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      // ตรวจสอบสิทธิ์
      const access = await storeService.checkUserAccess(req.user.id, id);
      if (!access) {
        res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงร้านค้านี้' });
        return;
      }

      const users = await storeService.getUsersInStore(id);
      res.json(users);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // PUT /api/stores/:id/default - ตั้งร้าน default
  async setDefault(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        return;
      }

      // ตรวจสอบสิทธิ์
      const access = await storeService.checkUserAccess(req.user.id, id);
      if (!access) {
        res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงร้านค้านี้' });
        return;
      }

      await storeService.setDefaultStore(req.user.id, id);
      res.json({ message: 'ตั้งร้าน default สำเร็จ' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}

export const storeController = new StoreController();

