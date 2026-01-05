import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Loader2,
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
import { api } from '../services/api';
import { CATEGORY_LABELS, ExpenseCategory, Summary, Transaction } from '../types/transaction';
import { formatMoney, getThaiMonthName } from '../utils/date';
import './Dashboard.css';

interface DayStats {
  date: string;
  income: number;
  expense: number;
  net: number;
  dayNum: number;
}

interface CategoryStats {
  name: string;
  value: number;
  category: ExpenseCategory;
  [key: string]: string | number; // Index signature for recharts
}

// Colors for charts
const COLORS = {
  income: '#2D5A27',
  expense: '#DC3545',
  net: '#4A7C59',
  categories: {
    ingredients: '#2D5A27',
    supplies: '#4A7C59',
    utilities: '#6B9B5E',
    other: '#8FBC8F',
  }
};

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
    .map(([date, stats]) => {
      const dateObj = new Date(date + 'T00:00:00');
      return {
        date,
        ...stats,
        net: stats.income - stats.expense,
        dayNum: dateObj.getDate(),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort ascending for charts
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

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">วันที่ {label}</p>
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

// Custom tooltip for pie chart
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

export function Dashboard() {
  const { currentStore } = useAuth();
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
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
  const categoryStats = currentSummary ? getCategoryStats(currentSummary.transactions) : [];

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

          {/* Chart 1: Line Chart - Income vs Expense */}
          {dayStats.length > 0 && (
            <section className="dashboard-section chart-section">
              <h2 className="section-title">
                <TrendingUp size={20} /> รายรับ vs รายจ่าย รายวัน
              </h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dayStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="dayNum"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke={COLORS.income}
                      strokeWidth={3}
                      dot={{ fill: COLORS.income, strokeWidth: 2 }}
                      name="รายรับ"
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke={COLORS.expense}
                      strokeWidth={3}
                      dot={{ fill: COLORS.expense, strokeWidth: 2 }}
                      name="รายจ่าย"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Chart 2: Bar Chart - Daily Net Profit */}
          {dayStats.length > 0 && (
            <section className="dashboard-section chart-section">
              <h2 className="section-title">
                <Wallet size={20} /> กำไร/ขาดทุน รายวัน
              </h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dayStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="dayNum"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="net" name="กำไร/ขาดทุน" radius={[4, 4, 0, 0]}>
                      {dayStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.net >= 0 ? COLORS.income : COLORS.expense}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Chart 3: Donut Chart - Expense by Category */}
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
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS.categories[entry.category]}
                        />
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
                        <span
                          className="pie-legend-color"
                          style={{ background: COLORS.categories[entry.category] }}
                        />
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
