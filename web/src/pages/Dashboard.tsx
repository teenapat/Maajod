import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { StoreSelector } from '../components/StoreSelector';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Summary, Transaction } from '../types/transaction';
import { formatMoney, formatThaiDate, getThaiMonthName } from '../utils/date';
import './Dashboard.css';

interface DayStats {
  date: string;
  income: number;
  expense: number;
}

function getDayStats(transactions: Transaction[]): DayStats[] {
  const grouped: Record<string, { income: number; expense: number }> = {};

  transactions.forEach(tx => {
    const dateKey = tx.date.split('T')[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      grouped[dateKey].income += tx.amount;
    } else {
      grouped[dateKey].expense += tx.amount;
    }
  });

  return Object.entries(grouped)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getMaxIncomeDay(dayStats: DayStats[]): DayStats | null {
  if (dayStats.length === 0) return null;
  return dayStats.reduce((max, day) => day.income > max.income ? day : max, dayStats[0]);
}

function getMaxExpenseDay(dayStats: DayStats[]): DayStats | null {
  if (dayStats.length === 0) return null;
  return dayStats.reduce((max, day) => day.expense > max.expense ? day : max, dayStats[0]);
}

export function Dashboard() {
  const { currentStore } = useAuth();
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const fetchData = async () => {
    if (!currentStore) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch current month
      const current = await api.getMonthlySummary(year, month);
      setCurrentSummary(current);

      // Fetch previous month
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prev = await api.getMonthlySummary(prevYear, prevMonth);
      setPrevSummary(prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month, currentStore?._id]);

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

  const dayStats = currentSummary ? getDayStats(currentSummary.transactions) : [];
  const maxIncomeDay = getMaxIncomeDay(dayStats);
  const maxExpenseDay = getMaxExpenseDay(dayStats);

  // Calculate comparison
  const incomeChange = prevSummary && prevSummary.totalIncome > 0
    ? ((currentSummary?.totalIncome || 0) - prevSummary.totalIncome) / prevSummary.totalIncome * 100
    : null;
  const expenseChange = prevSummary && prevSummary.totalExpense > 0
    ? ((currentSummary?.totalExpense || 0) - prevSummary.totalExpense) / prevSummary.totalExpense * 100
    : null;

  const prevMonthName = getThaiMonthName(month === 1 ? 12 : month - 1);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <LayoutDashboard size={32} className="dashboard-header-icon" />
        <h1 className="dashboard-page-title">ภาพรวมร้าน</h1>
        <StoreSelector onStoreChange={fetchData} />
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
        <div className="dashboard-loading">
          <Loader2 className="spinner-icon" size={48} />
          <p>กำลังโหลด...</p>
        </div>
      ) : error ? (
        <div className="message message-error">{error}</div>
      ) : currentSummary && (
        <div className="dashboard-content">
          {/* Main Stats */}
          <div className="stats-grid">
            <div className="stat-card income">
              <div className="stat-icon">
                <TrendingUp size={28} />
              </div>
              <div className="stat-info">
                <span className="stat-label">รายรับทั้งเดือน</span>
                <span className="stat-value">{formatMoney(currentSummary.totalIncome)}</span>
              </div>
            </div>

            <div className="stat-card expense">
              <div className="stat-icon">
                <TrendingDown size={28} />
              </div>
              <div className="stat-info">
                <span className="stat-label">รายจ่ายทั้งเดือน</span>
                <span className="stat-value">{formatMoney(currentSummary.totalExpense)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className={`net-card ${currentSummary.net >= 0 ? 'positive' : 'negative'}`}>
            <div className="net-header">
              <Wallet size={24} />
              <span>{currentSummary.net >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'}</span>
            </div>
            <div className="net-value">{formatMoney(Math.abs(currentSummary.net))}</div>
            <div className="net-status">
              {currentSummary.net >= 0 ? (
                <><Sparkles size={18} /> ยอดเยี่ยม!</>
              ) : (
                <><AlertTriangle size={18} /> ต้องระวัง</>
              )}
            </div>
          </div>

          {/* Day Statistics */}
          <section className="dashboard-section">
            <h2 className="section-title">
              <Award size={20} /> สถิติประจำเดือน
            </h2>

            <div className="highlight-cards">
              {maxIncomeDay && maxIncomeDay.income > 0 && (
                <div className="highlight-card income">
                  <div className="highlight-label">
                    <TrendingUp size={16} />
                    วันที่รายรับสูงสุด
                  </div>
                  <div className="highlight-date">{formatThaiDate(maxIncomeDay.date)}</div>
                  <div className="highlight-value">{formatMoney(maxIncomeDay.income)}</div>
                </div>
              )}

              {maxExpenseDay && maxExpenseDay.expense > 0 && (
                <div className="highlight-card expense">
                  <div className="highlight-label">
                    <TrendingDown size={16} />
                    วันที่รายจ่ายสูงสุด
                  </div>
                  <div className="highlight-date">{formatThaiDate(maxExpenseDay.date)}</div>
                  <div className="highlight-value">{formatMoney(maxExpenseDay.expense)}</div>
                </div>
              )}
            </div>
          </section>

          {/* Comparison */}
          {prevSummary && (
            <section className="dashboard-section">
              <h2 className="section-title">
                <CalendarDays size={20} /> เปรียบเทียบกับ{prevMonthName}
              </h2>

              <div className="comparison-card">
                <div className="comparison-row">
                  <span className="comparison-label">รายรับ</span>
                  <div className="comparison-values">
                    <span className="comparison-prev">{formatMoney(prevSummary.totalIncome)}</span>
                    <span className="comparison-arrow">→</span>
                    <span className="comparison-current">{formatMoney(currentSummary.totalIncome)}</span>
                  </div>
                  {incomeChange !== null && (
                    <div className={`comparison-change ${incomeChange >= 0 ? 'up' : 'down'}`}>
                      {incomeChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(incomeChange).toFixed(0)}%
                    </div>
                  )}
                </div>

                <div className="comparison-divider"></div>

                <div className="comparison-row">
                  <span className="comparison-label">รายจ่าย</span>
                  <div className="comparison-values">
                    <span className="comparison-prev">{formatMoney(prevSummary.totalExpense)}</span>
                    <span className="comparison-arrow">→</span>
                    <span className="comparison-current">{formatMoney(currentSummary.totalExpense)}</span>
                  </div>
                  {expenseChange !== null && (
                    <div className={`comparison-change ${expenseChange <= 0 ? 'up' : 'down'}`}>
                      {expenseChange <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      {Math.abs(expenseChange).toFixed(0)}%
                    </div>
                  )}
                </div>

                <div className="comparison-divider"></div>

                <div className="comparison-row net">
                  <span className="comparison-label">กำไร/ขาดทุน</span>
                  <div className="comparison-values">
                    <span className={`comparison-prev ${prevSummary.net >= 0 ? 'positive' : 'negative'}`}>
                      {formatMoney(prevSummary.net)}
                    </span>
                    <span className="comparison-arrow">→</span>
                    <span className={`comparison-current ${currentSummary.net >= 0 ? 'positive' : 'negative'}`}>
                      {formatMoney(currentSummary.net)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Simple Bar Chart */}
          {dayStats.length > 0 && (
            <section className="dashboard-section">
              <h2 className="section-title">
                <TrendingUp size={20} /> รายรับ 7 วันล่าสุด
              </h2>

              <div className="bar-chart">
                {dayStats.slice(0, 7).reverse().map((day) => {
                  const maxIncome = Math.max(...dayStats.slice(0, 7).map(d => d.income));
                  const percentage = maxIncome > 0 ? (day.income / maxIncome) * 100 : 0;
                  const dateObj = new Date(day.date + 'T00:00:00');
                  const dayNum = dateObj.getDate();

                  return (
                    <div key={day.date} className="bar-row">
                      <span className="bar-date">{dayNum}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill income"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="bar-value">{formatMoney(day.income)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
