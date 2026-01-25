import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Store } from './store.model';

export type TransactionType = 'income' | 'expense';
export type ExpenseCategory = 'ingredients' | 'supplies' | 'utilities' | 'other';

@Entity('transactions')
@Index(['storeId', 'date'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  storeId!: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store?: Store;

  @Column({ type: 'varchar', length: 20 })
  type!: TransactionType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: ExpenseCategory;

  @Column({ type: 'ntext', nullable: true })
  note?: string;

  @Column({ type: 'datetime', default: () => 'GETDATE()' })
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
