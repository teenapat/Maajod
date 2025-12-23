import { User, IUser } from '../models/user.model';

export class AuthService {
  // Login ด้วย username/password
  async login(username: string, password: string): Promise<IUser | null> {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return null;

    const isValid = await user.comparePassword(password);
    if (!isValid) return null;

    return user;
  }

  // สร้าง user ใหม่
  async createUser(
    username: string,
    password: string,
    name: string,
    role: 'admin' | 'user' = 'user'
  ): Promise<IUser> {
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      throw new Error('Username นี้ถูกใช้แล้ว');
    }

    const user = new User({
      username: username.toLowerCase(),
      password,
      name,
      role,
    });
    return user.save();
  }

  // ดึง user ทั้งหมด
  async getAllUsers(): Promise<IUser[]> {
    return User.find().select('-password');
  }

  // ดึง user by ID
  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
  }

  // เปลี่ยน password
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) return false;

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) return false;

    user.password = newPassword;
    await user.save();
    return true;
  }
}

export const authService = new AuthService();
