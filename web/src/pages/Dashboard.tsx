import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  Minus,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Button } from '../components/Button';
import { StoreSelector } from '../components/StoreSelector';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionModal } from '../contexts/TransactionModalContext';
import { api } from '../services/api';
import { CATEGORY_LABELS, ExpenseCategory, Summary as SummaryType, Transaction } from '../types/transaction';
import { formatMoney, getThaiMonthName } from '../utils/date';
import './Dashboard.css';

type PeriodType = 'month' | 'quarter' | 'year';

const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

interface TrendPoint {
  label: string;
  sortKey: number;
  income: number;
  expense: number;
  net: number;
}

interface CategoryStats {
  name: string;
  value: number;
  category: ExpenseCategory;
  [key: string]: string | number;
}

interface CompareCoords {
  year: number;
  month: number;
  quarter: number;
}

const COLORS = {
  income: '#2D5A27',
  expense: '#DC3545',
  net: '#4A7C59',
  current: '#4A7C59',
  previous: '#94a3b8',
  categories: {
    ingredients: '#2D5A27',
    supplies: '#4A7C59',
    utilities: '#6B9B5E',
    other: '#8FBC8F',
  }
};

function getPreviousCoords(periodType: PeriodType, coords: CompareCoords): CompareCoords {
  if (periodType === 'month') {
    if (coords.month === 1) return { ...coords, month: 12, year: coords.year - 1 };
    return { ...coords, month: coords.month - 1 };
  }
  if (periodType === 'quarter') {
    if (coords.quarter === 1) return { ...coords, quarter: 4, year: coords.year - 1 };
    return { ...coords, quarter: coords.quarter - 1 };
  }
  return { ...coords, year: coords.year - 1 };
}

function fetchSummaryFor(periodType: PeriodType, coords: CompareCoords): Promise<SummaryType> {
  if (periodType === 'quarter') return api.getQuarterlySummary(coords.year, coords.quarter);
  if (periodType === 'year') return api.getYearlySummary(coords.year);
  return api.getMonthlySummary(coords.year, coords.month);
}

// month -> รายวัน, quarter/year -> รายเดือน
function getTrendStats(transactions: Transaction[], periodType: PeriodType): TrendPoint[] {
  const byMonth = periodType !== 'month';
  const grouped: Record<string, { income: number; expense: number; sortKey: number; label: string }> = {};

  transactions.forEach(tx => {
    const datePart = tx.date.split('T')[0];
    const [, moStr, dayStr] = datePart.split('-');
    const monthIndex = Number(moStr) - 1;
    const day = Number(dayStr);

    const key = byMonth ? `m-${monthIndex}` : `d-${day}`;
    const sortKey = byMonth ? monthIndex : day;
    const label = byMonth ? THAI_MONTH_SHORT[monthIndex] : String(day);

    if (!grouped[key]) {
      grouped[key] = { income: 0, expense: 0, sortKey, label };
    }
    if (tx.type === 'income') {
      grouped[key].income += tx.amount;
    } else {
      grouped[key].expense += tx.amount;
    }
  });

  return Object.values(grouped)
    .map(g => ({
      label: g.label,
      sortKey: g.sortKey,
      income: g.income,
      expense: g.expense,
      net: g.income - g.expense,
    }))
    .sort((a, b) => a.sortKey - b.sortKey);
}

function getCategoryStats(transactions: Transaction[]): CategoryStats[] {
  const grouped: Record<ExpenseCategory, number> = {
    ingredients: 0,
    supplies: 0,
    utilities: 0,
    other: 0,
  };

  transactions.forEach(tx => {
    if (tx.type === 'expense' && tx.category) {
      grouped[tx.category] += tx.amount;
    }
  });

  return Object.entries(grouped)
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_LABELS[category as ExpenseCategory],
      value,
      category: category as ExpenseCategory,
    }));
}

function calcChange(current: number, previous: number): { percent: number | null; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) {
    if (current === 0) return { percent: 0, direction: 'flat' };
    return { percent: null, direction: 'up' };
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(percent) < 0.05) return { percent: 0, direction: 'flat' };
  return { percent, direction: percent > 0 ? 'up' : 'down' };
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatMoney(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p>{payload[0].name}: {formatMoney(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

interface CompareCardProps {
  label: string;
  current: number;
  previous: number;
  variant: 'income' | 'expense' | 'net';
}

function CompareCard({ label, current, previous, variant }: CompareCardProps) {
  const { percent, direction } = calcChange(current, previous);

  let trendClass: 'good' | 'bad' | 'flat' = 'flat';
  if (direction === 'flat') {
    trendClass = 'flat';
  } else if (variant === 'expense') {
    trendClass = direction === 'up' ? 'bad' : 'good';
  } else {
    trendClass = direction === 'up' ? 'good' : 'bad';
  }

  const percentText = percent === null ? 'ใหม่' : `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;

  return (
    <div className={`compare-card ${variant}`}>
      <div className="compare-card-head">
        <span className="compare-card-label">{label}</span>
        <span className="compare-card-value">{formatMoney(current)}</span>
      </div>
      <div className="compare-card-footer">
        <span className={`compare-trend ${trendClass}`}>
          {direction === 'up' && <ArrowUpRight size={14} />}
          {direction === 'down' && <ArrowDownRight size={14} />}
          {direction === 'flat' && <Minus size={14} />}
          {percentText}
        </span>
        <span className="compare-prev">เดิม {formatMoney(previous)}</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { currentStore } = useAuth();
  const { version } = useTransactionModal();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [periodType, setPeriodType] = useState<PeriodType>('month');

  const [current, setCurrent] = useState<SummaryType | null>(null);
  const [previous, setPrevious] = useState<SummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!currentStore) {
        setCurrent(null);
        setPrevious(null);
        setLoading(false);
        setError('');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const coords: CompareCoords = { year, month, quarter };
        const prevCoords = getPreviousCoords(periodType, coords);

        const [currentData, previousData] = await Promise.all([
          fetchSummaryFor(periodType, coords),
          fetchSummaryFor(periodType, prevCoords),
        ]);

        if (!cancelled) {
          setCurrent(currentData);
          setPrevious(previousData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [currentStore?.id, year, month, quarter, periodType, version]);

  const handlePrevPeriod = () => {
    const prev = getPreviousCoords(periodType, { year, month, quarter });
    setYear(prev.year);
    setMonth(prev.month);
    setQuarter(prev.quarter);
  };

  const handleNextPeriod = () => {
    if (periodType === 'month') {
      if (month === 12) {
        setMonth(1);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
      return;
    }
    if (periodType === 'quarter') {
      if (quarter === 4) {
        setQuarter(1);
        setYear(year + 1);
      } else {
        setQuarter(quarter + 1);
      }
      return;
    }
    setYear(year + 1);
  };

  const getPeriodLabel = () => {
    if (periodType === 'quarter') return `ไตรมาส ${quarter}`;
    if (periodType === 'year') return 'ทั้งปี';
    return getThaiMonthName(month);
  };

  const getCompareLabel = () => {
    if (periodType === 'quarter') return 'ไตรมาสที่แล้ว';
    if (periodType === 'year') return 'ปีที่แล้ว';
    return 'เดือนที่แล้ว';
  };

  const trendLabel = periodType === 'month' ? 'รายวัน' : 'รายเดือน';

  const trendStats = current ? getTrendStats(current.transactions, periodType) : [];
  const categoryStats = current ? getCategoryStats(current.transactions) : [];

  const compareChartData =
    current && previous
      ? [
          { name: 'รายรับ', current: current.totalIncome, previous: previous.totalIncome },
          { name: 'รายจ่าย', current: current.totalExpense, previous: previous.totalExpense },
          { name: 'กำไร', current: current.net, previous: previous.net },
        ]
      : [];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <LayoutDashboard size={32} className="dashboard-header-icon" />
        <h1 className="dashboard-page-title">ภาพรวมร้าน</h1>
        <StoreSelector onStoreChange={() => {}} />
      </header>

      <div className="dashboard-controls">
        <div className="summary-period-tabs" role="tablist" aria-label="เลือกช่วงสรุป">
          <button
            type="button"
            className={`summary-period-tab ${periodType === 'month' ? 'active' : ''}`}
            onClick={() => setPeriodType('month')}
          >
            เดือน
          </button>
          <button
            type="button"
            className={`summary-period-tab ${periodType === 'quarter' ? 'active' : ''}`}
            onClick={() => setPeriodType('quarter')}
          >
            ไตรมาส
          </button>
          <button
            type="button"
            className={`summary-period-tab ${periodType === 'year' ? 'active' : ''}`}
            onClick={() => setPeriodType('year')}
          >
            ปี
          </button>
        </div>

        <div className="month-selector">
          <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
            <ChevronLeft size={20} />
          </Button>
          <div className="month-display">
            <span className="month-name">{getPeriodLabel()}</span>
            <span className="month-year">{year + 543}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleNextPeriod}>
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <Loader2 className="spinner-icon" size={48} />
          <p>กำลังโหลด...</p>
        </div>
      ) : error ? (
        <div className="message message-error">{error}</div>
      ) : current && previous && (
        <div className="dashboard-content">
          {/* Main Stats */}
          <div className="stats-grid">
            <div className="stat-card income">
              <div className="stat-icon">
                <TrendingUp size={28} />
              </div>
              <div className="stat-info">
                <span className="stat-label">รายรับ</span>
                <span className="stat-value">{formatMoney(current.totalIncome)}</span>
              </div>
            </div>

            <div className="stat-card expense">
              <div className="stat-icon">
                <TrendingDown size={28} />
              </div>
              <div className="stat-info">
                <span className="stat-label">รายจ่าย</span>
                <span className="stat-value">{formatMoney(current.totalExpense)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className={`net-card ${current.net >= 0 ? 'positive' : 'negative'}`}>
            <div className="net-header">
              <Wallet size={24} />
              <span>{current.net >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'}</span>
            </div>
            <div className="net-value">{formatMoney(Math.abs(current.net))}</div>
            <div className="net-status">
              {current.net >= 0 ? (
                <><Sparkles size={18} /> ยอดเยี่ยม!</>
              ) : (
                <><AlertTriangle size={18} /> ต้องระวัง</>
              )}
            </div>
          </div>

          {/* Comparison vs previous period */}
          <section className="dashboard-section compare-section">
            <h2 className="section-title">
              <TrendingUp size={20} /> เทียบกับ{getCompareLabel()}
            </h2>
            <div className="compare-grid">
              <CompareCard label="รายรับ" current={current.totalIncome} previous={previous.totalIncome} variant="income" />
              <CompareCard label="รายจ่าย" current={current.totalExpense} previous={previous.totalExpense} variant="expense" />
              <CompareCard label={current.net >= 0 ? 'กำไร' : 'ขาดทุน'} current={current.net} previous={previous.net} variant="net" />
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={compareChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }} />
                  <Legend />
                  <Bar dataKey="previous" name={getCompareLabel()} fill={COLORS.previous} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" name="ช่วงนี้" fill={COLORS.current} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Trend: Income vs Expense */}
          {trendStats.length > 0 && (
            <section className="dashboard-section chart-section">
              <h2 className="section-title">
                <TrendingUp size={20} /> รายรับ vs รายจ่าย {trendLabel}
              </h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={3} dot={{ fill: COLORS.income, strokeWidth: 2 }} name="รายรับ" />
                    <Line type="monotone" dataKey="expense" stroke={COLORS.expense} strokeWidth={3} dot={{ fill: COLORS.expense, strokeWidth: 2 }} name="รายจ่าย" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Trend: Net */}
          {trendStats.length > 0 && (
            <section className="dashboard-section chart-section">
              <h2 className="section-title">
                <Wallet size={20} /> กำไร/ขาดทุน {trendLabel}
              </h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="net" name="กำไร/ขาดทุน" radius={[4, 4, 0, 0]}>
                      {trendStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.net >= 0 ? COLORS.income : COLORS.expense} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Expense by Category */}
          {categoryStats.length > 0 && (
            <section className="dashboard-section chart-section">
              <h2 className="section-title">
                <PieChartIcon size={20} /> รายจ่ายแยกตามประเภท
              </h2>
              <div className="chart-container pie-chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.categories[entry.category]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {categoryStats.map((entry) => {
                    const total = categoryStats.reduce((sum, e) => sum + e.value, 0);
                    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                    return (
                      <div key={entry.category} className="pie-legend-item">
                        <span className="pie-legend-color" style={{ background: COLORS.categories[entry.category] }} />
                        <span className="pie-legend-label">{entry.name}</span>
                        <span className="pie-legend-percent">{percent}%</span>
                        <span className="pie-legend-value">{formatMoney(entry.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
