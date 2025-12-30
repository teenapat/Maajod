import { CreateTransactionInput, Summary, Transaction } from '../types/transaction';
import { Store } from '../types/store';

// ใช้ env variable สำหรับ API URL
// - Local: ใช้ proxy ผ่าน vite (VITE_API_URL ว่าง หรือไม่ได้ตั้ง)
// - Production: ใช้ URL จริง เช่น https://api.example.com
export const API_BASE = import.meta.env.VITE_API_URL || '';


function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const storeId = localStorage.getItem('currentStoreId');
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(storeId ? { 'X-Store-Id': storeId } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Token หมดอายุ หรือไม่ถูกต้อง
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('stores');
    localStorage.removeItem('currentStoreId');
    window.location.href = '/login';
    throw new Error('กรุณาเข้าสู่ระบบใหม่');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Something went wrong');
  }
  return response.json();
}

export const api = {
  // สร้าง Transaction ใหม่
  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    const response = await fetch(`${API_BASE}/api/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Transaction>(response);
  },

  // ดึงสรุปรายวัน
  async getDailySummary(date?: string): Promise<Summary> {
    const params = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE}/api/summary/daily${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Summary>(response);
  },

  // ดึงสรุปรายเดือน
  async getMonthlySummary(year?: number, month?: number): Promise<Summary> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/api/summary/monthly${queryString}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Summary>(response);
  },

  // ลบ Transaction
  async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  // ===== Store API =====

  // ดึงร้านทั้งหมดของ user
  async getMyStores(): Promise<Store[]> {
    const response = await fetch(`${API_BASE}/api/stores`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Store[]>(response);
  },

  // สร้างร้านใหม่
  async createStore(name: string, description?: string): Promise<{ store: Store }> {
    const response = await fetch(`${API_BASE}/api/stores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description }),
    });
    return handleResponse<{ store: Store }>(response);
  },

  // ตั้งร้าน default
  async setDefaultStore(storeId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/stores/${storeId}/default`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },
};
