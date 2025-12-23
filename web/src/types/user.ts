export type UserRole = 'owner' | 'child';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  message: string;
  user: User;
}

