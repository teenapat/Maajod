import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { Summary } from '../types/transaction';

interface CacheEntry {
  data: Summary;
  timestamp: number;
}

// Cache เก็บข้อมูลไว้ 5 นาที
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global cache สำหรับแชร์ระหว่าง components
const cache = new Map<string, CacheEntry>();

function getCacheKey(storeId: string, year: number, month: number): string {
  return `${storeId}-${year}-${month}`;
}

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION;
}

export function useMonthlySummary(storeId: string | null, year: number, month: number) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!storeId) {
      setData(null);
      setLoading(false);
      setError('');
      return;
    }

    const cacheKey = getCacheKey(storeId, year, month);
    const cached = cache.get(cacheKey);

    // ตรวจสอบ cache ก่อน
    if (cached && isCacheValid(cached)) {
      setData(cached.data);
      setLoading(false);
      setError('');
      return;
    }

    // ถ้า cache หมดอายุหรือไม่มี ให้เรียก API
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError('');

    api.getMonthlySummary(year, month)
      .then((result) => {
        if (!controller.signal.aborted) {
          // เก็บใน cache
          cache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [storeId, year, month]);

  // Function สำหรับ invalidate cache (ใช้เมื่อมีการเพิ่ม/ลบ transaction)
  const invalidateCache = () => {
    if (storeId) {
      const cacheKey = getCacheKey(storeId, year, month);
      cache.delete(cacheKey);
    }
  };

  return { data, loading, error, invalidateCache };
}

// Function สำหรับ clear cache ทั้งหมด (ใช้เมื่อเปลี่ยน store)
export function clearMonthlySummaryCache(storeId?: string) {
  if (storeId) {
    // Clear cache เฉพาะ store นี้
    const keysToDelete: string[] = [];
    cache.forEach((_, key) => {
      if (key.startsWith(`${storeId}-`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => cache.delete(key));
  } else {
    // Clear cache ทั้งหมด
    cache.clear();
  }
}
