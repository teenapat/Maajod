import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransactionType = 'income' | 'expense';
export type ExpenseCategory = 'ingredients' | 'supplies' | 'utilities' | 'other';

export interface ITransaction extends Document {
  storeId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  category?: ExpenseCategory;
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['ingredients', 'supplies', 'utilities', 'other'],
      required: function (this: ITransaction) {
        return this.type === 'expense';
      },
    },
    note: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index สำหรับ query by store และ date
TransactionSchema.index({ storeId: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
