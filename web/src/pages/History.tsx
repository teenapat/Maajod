import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Loader2, TrendingDown, TrendingUp, Wallet, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { api } from '../services/api';
import { Transaction } from '../types/transaction';
import { formatMoney, formatThaiDate, getThaiMonthName } from '../utils/date';
import './History.css';

interface DailySummary {
  date: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactions: Transaction[];
}

function groupTransactionsByDate(transactions: Transaction[]): DailySummary[] {
  const grouped: Record<string, Transaction[]> = {};

  // Group transactions by date
  transactions.forEach(tx => {
    const dateKey = tx.date.split('T')[0]; // Get YYYY-MM-DD
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(tx);
  });

  // Convert to array and calculate totals
  return Object.entries(grouped)
    .map(([date, txs]) => {
      const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return {
        date,
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        transactions: txs,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // Latest first
}

export function History() {
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMonthlySummary(year, month);
      setDailySummaries(groupTransactionsByDate(data.transactions));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

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

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return;

    try {
      await api.deleteTransaction(id);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    }
  };

  return (
    <div className="history-page">
      <header className="history-header">
        <CalendarDays size={32} className="history-header-icon" />
        <h1 className="history-page-title">ย้อนหลังรายวัน</h1>
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
        <div className="history-loading">
          <Loader2 className="spinner-icon" size={48} />
          <p>กำลังโหลด...</p>
        </div>
      ) : error ? (
        <div className="message message-error">{error}</div>
      ) : dailySummaries.length === 0 ? (
        <div className="history-empty">
          <CalendarDays size={64} className="empty-icon" />
          <p>ไม่มีรายการในเดือนนี้</p>
        </div>
      ) : (
        <div className="timeline">
          {dailySummaries.map((day) => (
            <div
              key={day.date}
              className={`timeline-card ${day.net >= 0 ? 'positive' : 'negative'}`}
              onClick={() => toggleExpand(day.date)}
            >
              <div className="timeline-date">
                <CalendarDays size={18} />
                <span>{formatThaiDate(day.date)}</span>
              </div>

              <div className="timeline-summary">
                <div className="timeline-row">
                  <span className="timeline-label income">
                    <TrendingUp size={16} /> รายรับ
                  </span>
                  <span className="timeline-value income">{formatMoney(day.totalIncome)}</span>
                </div>
                <div className="timeline-row">
                  <span className="timeline-label expense">
                    <TrendingDown size={16} /> รายจ่าย
                  </span>
                  <span className="timeline-value expense">{formatMoney(day.totalExpense)}</span>
                </div>
                <div className="timeline-divider"></div>
                <div className="timeline-row net">
                  <span className="timeline-label">
                    <Wallet size={16} /> {day.net >= 0 ? 'กำไร' : 'ขาดทุน'}
                  </span>
                  <span className={`timeline-value ${day.net >= 0 ? 'positive' : 'negative'}`}>
                    {formatMoney(Math.abs(day.net))}
                  </span>
                </div>
              </div>

              <div className="timeline-indicator">
                {day.net >= 0 ? (
                  <CheckCircle2 size={20} className="indicator-positive" />
                ) : (
                  <XCircle size={20} className="indicator-negative" />
                )}
              </div>

              {expandedDate === day.date && (
                <div className="timeline-details" onClick={(e) => e.stopPropagation()}>
                  <h4 className="details-title">รายการทั้งหมด ({day.transactions.length})</h4>
                  <ul className="details-list">
                    {day.transactions.map((tx) => (
                      <li key={tx._id} className={`detail-item ${tx.type}`}>
                        <div className="detail-info">
                          {tx.type === 'income' ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}
                          <span className="detail-note">{tx.note || (tx.type === 'income' ? 'รายรับ' : 'รายจ่าย')}</span>
                        </div>
                        <div className="detail-actions">
                          <span className={`detail-amount ${tx.type}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                          </span>
                          <button
                            className="detail-delete"
                            onClick={() => handleDelete(tx._id)}
                            title="ลบรายการ"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

