import { Store, IStore } from '../models/store.model';
import { UserStore, IUserStore, StoreRole } from '../models/user-store.model';
import { Types } from 'mongoose';

export interface CreateStoreInput {
  name: string;
  description?: string;
}

export interface StoreWithRole extends IStore {
  userRole: StoreRole;
  isDefault: boolean;
}

export class StoreService {
  // สร้างร้านใหม่ และ assign owner
  async createStore(data: CreateStoreInput, ownerId: string): Promise<{ store: IStore; userStore: IUserStore }> {
    const store = new Store({
      name: data.name,
      description: data.description || '',
    });
    await store.save();

    // เพิ่ม owner เข้าร้าน
    const userStore = new UserStore({
      userId: new Types.ObjectId(ownerId),
      storeId: store._id,
      role: 'owner',
      isDefault: true, // ร้านแรกเป็น default
    });
    await userStore.save();

    return { store, userStore };
  }

  // ดึงร้านทั้งหมดของ user
  async getStoresByUserId(userId: string): Promise<StoreWithRole[]> {
    const userStores = await UserStore.find({ userId: new Types.ObjectId(userId) })
      .populate<{ storeId: IStore }>('storeId')
      .lean();

    return userStores.map((us) => ({
      ...(us.storeId as IStore),
      userRole: us.role,
      isDefault: us.isDefault,
    }));
  }

  // ดึงร้านตาม ID
  async getStoreById(storeId: string): Promise<IStore | null> {
    return Store.findById(storeId);
  }

  // อัพเดทข้อมูลร้าน
  async updateStore(storeId: string, data: Partial<CreateStoreInput>): Promise<IStore | null> {
    return Store.findByIdAndUpdate(storeId, data, { new: true });
  }

  // เพิ่ม user เข้าร้าน
  async addUserToStore(
    storeId: string,
    userId: string,
    role: StoreRole = 'member'
  ): Promise<IUserStore> {
    // ตรวจสอบว่ามีอยู่แล้วหรือไม่
    const existing = await UserStore.findOne({
      userId: new Types.ObjectId(userId),
      storeId: new Types.ObjectId(storeId),
    });

    if (existing) {
      throw new Error('User อยู่ในร้านนี้แล้ว');
    }

    const userStore = new UserStore({
      userId: new Types.ObjectId(userId),
      storeId: new Types.ObjectId(storeId),
      role,
      isDefault: false,
    });
    return userStore.save();
  }

  // ลบ user ออกจากร้าน
  async removeUserFromStore(storeId: string, userId: string): Promise<boolean> {
    const result = await UserStore.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      storeId: new Types.ObjectId(storeId),
    });
    return !!result;
  }

  // ดึง users ทั้งหมดในร้าน
  async getUsersInStore(storeId: string): Promise<IUserStore[]> {
    return UserStore.find({ storeId: new Types.ObjectId(storeId) })
      .populate('userId', '-password')
      .lean();
  }

  // ตรวจสอบว่า user มีสิทธิ์เข้าถึงร้านหรือไม่
  async checkUserAccess(userId: string, storeId: string): Promise<IUserStore | null> {
    return UserStore.findOne({
      userId: new Types.ObjectId(userId),
      storeId: new Types.ObjectId(storeId),
    });
  }

  // ตั้งร้าน default ของ user
  async setDefaultStore(userId: string, storeId: string): Promise<void> {
    // ยกเลิก default เดิมทั้งหมด
    await UserStore.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isDefault: false }
    );

    // ตั้ง default ใหม่
    await UserStore.updateOne(
      { userId: new Types.ObjectId(userId), storeId: new Types.ObjectId(storeId) },
      { isDefault: true }
    );
  }

  // ดึงร้าน default ของ user
  async getDefaultStore(userId: string): Promise<IUserStore | null> {
    return UserStore.findOne({
      userId: new Types.ObjectId(userId),
      isDefault: true,
    }).populate('storeId');
  }
}

export const storeService = new StoreService();

