import { AppDataSource } from '../config/database';
import { Store } from '../models/store.model';
import { UserStore, StoreRole } from '../models/user-store.model';
import { Repository } from 'typeorm';

export interface CreateStoreInput {
  name: string;
  description?: string;
}

// Plain object types
export interface StoreData {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreWithRole extends StoreData {
  userRole: StoreRole;
  isDefault: boolean;
}

export interface UserStoreData {
  id: string;
  userId: string | { id: string; username: string; name: string; role: string };
  storeId: string;
  role: StoreRole;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StoreService {
  private storeRepository: Repository<Store>;
  private userStoreRepository: Repository<UserStore>;

  constructor() {
    this.storeRepository = AppDataSource.getRepository(Store);
    this.userStoreRepository = AppDataSource.getRepository(UserStore);
  }

  // สร้างร้านใหม่ และ assign owner
  async createStore(data: CreateStoreInput, ownerId: string): Promise<{ store: Store; userStore: UserStore }> {
    const store = this.storeRepository.create({
      name: data.name,
      description: data.description || '',
    });
    const savedStore = await this.storeRepository.save(store);

    // เพิ่ม owner เข้าร้าน
    const userStore = this.userStoreRepository.create({
      userId: ownerId,
      storeId: savedStore.id,
      role: 'owner',
      isDefault: true, // ร้านแรกเป็น default
    });
    const savedUserStore = await this.userStoreRepository.save(userStore);

    return { store: savedStore, userStore: savedUserStore };
  }

  // ดึงร้านทั้งหมดของ user
  async getStoresByUserId(userId: string): Promise<StoreWithRole[]> {
    const userStores = await this.userStoreRepository.find({
      where: { userId },
      relations: ['store'],
    });

    return userStores.map((us) => ({
      id: us.store!.id,
      name: us.store!.name,
      description: us.store!.description,
      isActive: us.store!.isActive,
      createdAt: us.store!.createdAt,
      updatedAt: us.store!.updatedAt,
      userRole: us.role,
      isDefault: us.isDefault,
    }));
  }

  // ดึงร้านตาม ID
  async getStoreById(storeId: string): Promise<Store | null> {
    return this.storeRepository.findOne({
      where: { id: storeId },
    });
  }

  // อัพเดทข้อมูลร้าน
  async updateStore(storeId: string, data: Partial<CreateStoreInput>): Promise<Store | null> {
    await this.storeRepository.update(storeId, data);
    return this.getStoreById(storeId);
  }

  // เพิ่ม user เข้าร้าน
  async addUserToStore(
    storeId: string,
    userId: string,
    role: StoreRole = 'member'
  ): Promise<UserStore> {
    // ตรวจสอบว่ามีอยู่แล้วหรือไม่
    const existing = await this.userStoreRepository.findOne({
      where: {
        userId,
        storeId,
      },
    });

    if (existing) {
      throw new Error('User อยู่ในร้านนี้แล้ว');
    }

    const userStore = this.userStoreRepository.create({
      userId,
      storeId,
      role,
      isDefault: false,
    });
    return this.userStoreRepository.save(userStore);
  }

  // ลบ user ออกจากร้าน
  async removeUserFromStore(storeId: string, userId: string): Promise<boolean> {
    const result = await this.userStoreRepository.delete({
      userId,
      storeId,
    });
    return (result.affected || 0) > 0;
  }

  // ดึง users ทั้งหมดในร้าน
  async getUsersInStore(storeId: string): Promise<UserStoreData[]> {
    const userStores = await this.userStoreRepository.find({
      where: { storeId },
      relations: ['user'],
    });

    return userStores.map((us) => ({
      id: us.id,
      userId: us.user ? {
        id: us.user.id,
        username: us.user.username,
        name: us.user.name,
        role: us.user.role,
      } : us.userId,
      storeId: us.storeId,
      role: us.role,
      isDefault: us.isDefault,
      createdAt: us.createdAt,
      updatedAt: us.updatedAt,
    }));
  }

  // ตรวจสอบว่า user มีสิทธิ์เข้าถึงร้านหรือไม่
  async checkUserAccess(userId: string, storeId: string): Promise<UserStore | null> {
    return this.userStoreRepository.findOne({
      where: {
        userId,
        storeId,
      },
    });
  }

  // ตั้งร้าน default ของ user
  async setDefaultStore(userId: string, storeId: string): Promise<void> {
    // ยกเลิก default เดิมทั้งหมด
    await this.userStoreRepository.update(
      { userId },
      { isDefault: false }
    );

    // ตั้ง default ใหม่
    await this.userStoreRepository.update(
      { userId, storeId },
      { isDefault: true }
    );
  }

  // ดึงร้าน default ของ user
  async getDefaultStore(userId: string): Promise<UserStore | null> {
    return this.userStoreRepository.findOne({
      where: {
        userId,
        isDefault: true,
      },
      relations: ['store'],
    });
  }
}

export const storeService = new StoreService();
