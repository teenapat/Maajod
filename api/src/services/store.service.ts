import { Types } from 'mongoose';
import { IStore, Store } from '../models/store.model';
import { IUserStore, UserStore, StoreRole } from '../models/user-store.model';

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
  private toObjectId(value: string): Types.ObjectId {
    return new Types.ObjectId(value);
  }

  private toStoreData(store: IStore): StoreData {
    return {
      id: store._id.toString(),
      name: store.name,
      description: store.description,
      isActive: store.isActive,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }

  // สร้างร้านใหม่ และ assign owner
  async createStore(data: CreateStoreInput, ownerId: string): Promise<{ store: StoreData; userStore: UserStoreData }> {
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new Error('Owner ID ไม่ถูกต้อง');
    }

    const store = new Store({
      name: data.name,
      description: data.description || '',
    });
    const savedStore = await store.save();

    const hasAnyStore = await UserStore.exists({ userId: this.toObjectId(ownerId) });

    // เพิ่ม owner เข้าร้าน
    const userStore = new UserStore({
      userId: this.toObjectId(ownerId),
      storeId: savedStore._id,
      role: 'owner',
      isDefault: !hasAnyStore, // ร้านแรกเป็น default
    });
    const savedUserStore = await userStore.save();

    return {
      store: this.toStoreData(savedStore),
      userStore: {
        id: savedUserStore._id.toString(),
        userId: savedUserStore.userId.toString(),
        storeId: savedUserStore.storeId.toString(),
        role: savedUserStore.role,
        isDefault: savedUserStore.isDefault,
        createdAt: savedUserStore.createdAt,
        updatedAt: savedUserStore.updatedAt,
      },
    };
  }

  // ดึงร้านทั้งหมดของ user
  async getStoresByUserId(userId: string): Promise<StoreWithRole[]> {
    if (!Types.ObjectId.isValid(userId)) return [];

    const userStores = await UserStore.find({
      userId: this.toObjectId(userId),
    }).populate('storeId');

    return userStores
      .filter((us) => Boolean(us.storeId))
      .map((us) => ({
        ...this.toStoreData(us.storeId as unknown as IStore),
        userRole: us.role,
        isDefault: us.isDefault,
      }));
  }

  // ดึงร้านตาม ID
  async getStoreById(storeId: string): Promise<StoreData | null> {
    if (!Types.ObjectId.isValid(storeId)) return null;
    const store = await Store.findById(new Types.ObjectId(storeId));
    return store ? this.toStoreData(store) : null;
  }

  // อัพเดทข้อมูลร้าน
  async updateStore(storeId: string, data: Partial<CreateStoreInput>): Promise<StoreData | null> {
    if (!Types.ObjectId.isValid(storeId)) return null;
    await Store.findByIdAndUpdate(new Types.ObjectId(storeId), data);
    return this.getStoreById(storeId);
  }

  // เพิ่ม user เข้าร้าน
  async addUserToStore(
    storeId: string,
    userId: string,
    role: StoreRole = 'member'
  ): Promise<UserStoreData> {
    if (!Types.ObjectId.isValid(storeId) || !Types.ObjectId.isValid(userId)) {
      throw new Error('Store ID หรือ User ID ไม่ถูกต้อง');
    }

    // ตรวจสอบว่ามีอยู่แล้วหรือไม่
    const existing = await UserStore.findOne({
      userId: this.toObjectId(userId),
      storeId: this.toObjectId(storeId),
    });

    if (existing) {
      throw new Error('User อยู่ในร้านนี้แล้ว');
    }

    const userStore = new UserStore({
      userId: this.toObjectId(userId),
      storeId: this.toObjectId(storeId),
      role,
      isDefault: false,
    });
    const saved = await userStore.save();
    return {
      id: saved._id.toString(),
      userId: saved.userId.toString(),
      storeId: saved.storeId.toString(),
      role: saved.role,
      isDefault: saved.isDefault,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  // ลบ user ออกจากร้าน
  async removeUserFromStore(storeId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(storeId) || !Types.ObjectId.isValid(userId)) {
      return false;
    }
    const result = await UserStore.deleteOne({
      userId: this.toObjectId(userId),
      storeId: this.toObjectId(storeId),
    });
    return (result.deletedCount || 0) > 0;
  }

  // ดึง users ทั้งหมดในร้าน
  async getUsersInStore(storeId: string): Promise<UserStoreData[]> {
    if (!Types.ObjectId.isValid(storeId)) return [];

    const userStores = await UserStore.find({
      storeId: this.toObjectId(storeId),
    }).populate('userId');

    return userStores.map((us) => ({
      id: us._id.toString(),
      userId: us.userId && typeof us.userId === 'object' && 'username' in us.userId ? {
        id: (us.userId as any)._id.toString(),
        username: (us.userId as any).username,
        name: (us.userId as any).name,
        role: (us.userId as any).role,
      } : us.userId.toString(),
      storeId: us.storeId.toString(),
      role: us.role,
      isDefault: us.isDefault,
      createdAt: us.createdAt,
      updatedAt: us.updatedAt,
    }));
  }

  // ตรวจสอบว่า user มีสิทธิ์เข้าถึงร้านหรือไม่
  async checkUserAccess(userId: string, storeId: string): Promise<IUserStore | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(storeId)) {
      return null;
    }
    return UserStore.findOne({
      userId: new Types.ObjectId(userId),
      storeId: new Types.ObjectId(storeId),
    });
  }

  // ตั้งร้าน default ของ user
  async setDefaultStore(userId: string, storeId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(storeId)) {
      throw new Error('Store ID หรือ User ID ไม่ถูกต้อง');
    }

    // ยกเลิก default เดิมทั้งหมด
    await UserStore.updateMany({ userId: this.toObjectId(userId) }, { isDefault: false });

    // ตั้ง default ใหม่
    await UserStore.updateOne(
      { userId: this.toObjectId(userId), storeId: this.toObjectId(storeId) },
      { isDefault: true }
    );
  }

  // ดึงร้าน default ของ user
  async getDefaultStore(userId: string): Promise<IUserStore | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return UserStore.findOne({
      userId: this.toObjectId(userId),
      isDefault: true,
    }).populate('storeId');
  }
}

export const storeService = new StoreService();
