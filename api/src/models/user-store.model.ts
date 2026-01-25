import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Store } from './store.model';
import { User } from './user.model';

export type StoreRole = 'owner' | 'admin' | 'member';

@Entity('user_stores')
@Unique(['userId', 'storeId'])
@Index(['userId'])
@Index(['storeId'])
export class UserStore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column('uuid')
  storeId!: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'storeId' })
  store?: Store;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role!: StoreRole;

  @Column({ type: 'bit', default: 0 })
  isDefault!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
