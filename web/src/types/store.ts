export type StoreRole = 'owner' | 'admin' | 'member';

export interface Store {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  userRole: StoreRole;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

