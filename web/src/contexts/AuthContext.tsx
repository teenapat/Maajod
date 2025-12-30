import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { API_BASE } from '../services/api';
import { Store } from '../types/store';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  stores: Store[];
  currentStore: Store | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchStore: (storeId: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // โหลด token จาก localStorage ตอนเริ่มต้น
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedStores = localStorage.getItem('stores');
    const savedCurrentStoreId = localStorage.getItem('currentStoreId');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));

      if (savedStores) {
        const parsedStores: Store[] = JSON.parse(savedStores);
        setStores(parsedStores);

        // หา current store จาก savedCurrentStoreId หรือใช้ default
        if (savedCurrentStoreId) {
          const found = parsedStores.find(s => s._id === savedCurrentStoreId);
          if (found) {
            setCurrentStore(found);
          } else if (parsedStores.length > 0) {
            // ถ้าไม่เจอ ใช้ default หรือตัวแรก
            const defaultStore = parsedStores.find(s => s.isDefault) || parsedStores[0];
            setCurrentStore(defaultStore);
            localStorage.setItem('currentStoreId', defaultStore._id);
          }
        } else if (parsedStores.length > 0) {
          // ยังไม่เคยเลือกร้าน ใช้ default หรือตัวแรก
          const defaultStore = parsedStores.find(s => s.isDefault) || parsedStores[0];
          setCurrentStore(defaultStore);
          localStorage.setItem('currentStoreId', defaultStore._id);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }

    const data = await response.json();

    setToken(data.token);
    setUser(data.user);
    setStores(data.stores || []);

    // เลือกร้าน default หรือตัวแรก
    if (data.stores && data.stores.length > 0) {
      const defaultStore = data.stores.find((s: Store) => s.isDefault) || data.stores[0];
      setCurrentStore(defaultStore);
      localStorage.setItem('currentStoreId', defaultStore._id);
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('stores', JSON.stringify(data.stores || []));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStores([]);
    setCurrentStore(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stores');
    localStorage.removeItem('currentStoreId');
  };

  const switchStore = (storeId: string) => {
    const store = stores.find(s => s._id === storeId);
    if (store) {
      setCurrentStore(store);
      localStorage.setItem('currentStoreId', storeId);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, stores, currentStore, login, logout, switchStore, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
