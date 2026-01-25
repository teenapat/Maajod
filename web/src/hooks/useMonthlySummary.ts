import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { Summary } from '../types/transaction';

export function useMonthlySummary(storeId: string | null, year: number, month: number, refreshKey?: number) {
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

    // เรียก API ทุกครั้ง (ไม่มี cache) - เรียงตามเวลาล่าสุดก่อน
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError('');

    api.getMonthlySummary(year, month)
      .then((result) => {
        if (!controller.signal.aborted) {
          // เรียง transactions ตามเวลาล่าสุดก่อน (date DESC, createdAt DESC)
          if (result.transactions) {
            result.transactions.sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              if (dateB !== dateA) return dateB - dateA; // วันที่ใหม่ก่อน
              // ถ้าวันที่เท่ากัน เรียงตาม createdAt
              const createdA = new Date(a.createdAt || a.date).getTime();
              const createdB = new Date(b.createdAt || b.date).getTime();
              return createdB - createdA; // สร้างใหม่ก่อน
            });
          }
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
  }, [storeId, year, month, refreshKey]); // เพิ่ม refreshKey ใน dependencies

  return { data, loading, error };
}
