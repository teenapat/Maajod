import mongoose, { Document, Schema, Types } from 'mongoose';

export type StoreRole = 'owner' | 'admin' | 'member';

export interface IUserStore extends Document {
  userId: Types.ObjectId;
  storeId: Types.ObjectId;
  role: StoreRole;
  isDefault: boolean; // ร้านที่ user เลือกเป็น default
  createdAt: Date;
  updatedAt: Date;
}

const UserStoreSchema = new Schema<IUserStore>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index - user สามารถเข้าถึง store ได้แค่ครั้งเดียว
UserStoreSchema.index({ userId: 1, storeId: 1 }, { unique: true });

// Index สำหรับ query หาร้านของ user
UserStoreSchema.index({ userId: 1 });

// Index สำหรับ query หา user ในร้าน
UserStoreSchema.index({ storeId: 1 });

export const UserStore = mongoose.model<IUserStore>('UserStore', UserStoreSchema);

