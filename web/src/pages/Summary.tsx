import { BarChart3, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionList } from '../components/TransactionList';
import { StoreSelector } from '../components/StoreSelector';
import { useAuth } from '../contexts/AuthContext';
import { useMonthlySummary } from '../hooks/useMonthlySummary';
import { api } from '../services/api';
import { getThaiMonthName } from '../utils/date';
import './Summary.css';

export function Summary() {
  const { currentStore } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0); // สำหรับ trigger re-fetch

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // ใช้ custom hook (ไม่มี cache - ดึงข้อมูลใหม่ทุกครั้ง)
  const { data: summary, loading, error } = useMonthlySummary(
    currentStore?.id || null,
    year,
    month,
    refreshKey
  );

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return;

    try {
      await api.deleteTransaction(id);
      // Trigger re-fetch โดยเปลี่ยน refreshKey
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="summary-page">
      <header className="summary-header">
        <BarChart3 size={32} className="summary-header-icon" />
        <h1 className="summary-page-title">สรุปรายเดือน</h1>
        <StoreSelector onStoreChange={() => {}} />
      </header>

      <div className="month-selector">
        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
          <ChevronLeft size={20} />
        </Button>
        <div className="month-display">
          <span className="month-name">{getThaiMonthName(month)}</span>
          <span className="month-year">{year + 543}</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          <ChevronRight size={20} />
        </Button>
      </div>

      {loading ? (
        <div className="summary-loading">
          <Loader2 className="spinner-icon" size={48} />
          <p>กำลังโหลด...</p>
        </div>
      ) : error ? (
        <div className="message message-error">{error}</div>
      ) : summary && (
        <>
          <SummaryCard
            totalIncome={summary.totalIncome}
            totalExpense={summary.totalExpense}
            net={summary.net}
          />

          <section className="summary-transactions">
            <h2 className="section-title">
              รายการทั้งหมด ({summary.transactions.length} รายการ)
            </h2>
            <TransactionList
              transactions={summary.transactions}
              onDelete={handleDelete}
            />
          </section>
        </>
      )}
    </div>
  );
}
