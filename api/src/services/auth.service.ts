import { AppDataSource } from '../config/database';
import { User } from '../models/user.model';
import { Repository } from 'typeorm';

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  // Login ด้วย username/password
  async login(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { username: username.toLowerCase() },
    });
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
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username: username.toLowerCase() },
    });
    if (existingUser) {
      throw new Error('Username นี้ถูกใช้แล้ว');
    }

    const user = this.userRepository.create({
      username: username.toLowerCase(),
      password,
      name,
      role,
    });
    return this.userRepository.save(user);
  }

  // ดึง user ทั้งหมด
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  }

  // ดึง user by ID
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  }

  // เปลี่ยน password
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) return false;

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) return false;

    user.password = newPassword;
    await this.userRepository.save(user);
    return true;
  }
}

export const authService = new AuthService();
