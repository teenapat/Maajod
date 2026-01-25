import { Hand, Loader2, Receipt, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionList } from '../components/TransactionList';
import { StoreSelector } from '../components/StoreSelector';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Summary } from '../types/transaction';
import { formatThaiDate, getToday } from '../utils/date';
import './Home.css';

export function Home() {
  const { user, currentStore } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!currentStore) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const data = await api.getDailySummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentStore?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return;

    try {
      await api.deleteTransaction(id);
      fetchData();
      // Hook ในหน้าอื่นๆ จะดึงข้อมูลใหม่อัตโนมัติ (ไม่มี cache)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ลบไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <div className="home-loading">
        <Loader2 className="spinner-icon" size={48} />
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  // ถ้ายังไม่มีร้าน
  if (!currentStore) {
    return (
      <div className="home">
        <header className="home-header">
          <div className="home-logo">
            <Receipt size={40} />
          </div>
          <h1 className="home-title">แม่จด</h1>
        </header>
        <div className="message message-error">
          คุณยังไม่มีร้านค้า กรุณาติดต่อผู้ดูแลระบบ
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-logo">
          <Receipt size={40} />
        </div>
        <h1 className="home-title">แม่จด</h1>
        {user && (
          <p className="home-greeting">
            <Hand size={18} />
            สวัสดี, {user.name}
            <Sparkles size={16} />
          </p>
        )}
        <div className="home-store-selector">
          <StoreSelector onStoreChange={fetchData} />
        </div>
        <p className="home-date">{formatThaiDate(getToday())}</p>
      </header>

      {error && (
        <div className="message message-error mb-md">{error}</div>
      )}

      {summary && (
        <div className="home-content">
          {/* Left column: Summary + Actions */}
          <div className="home-main">
            <SummaryCard
              title="สรุปวันนี้"
              totalIncome={summary.totalIncome}
              totalExpense={summary.totalExpense}
              net={summary.net}
            />

            <div className="home-actions">
              <Link to="/income">
                <Button variant="income" size="lg" fullWidth>
                  <TrendingUp size={24} />
                  เพิ่มรายรับ
                </Button>
              </Link>
              <Link to="/expense">
                <Button variant="expense" size="lg" fullWidth>
                  <TrendingDown size={24} />
                  เพิ่มรายจ่าย
                </Button>
              </Link>
            </div>
          </div>

          {/* Right column: Transaction List */}
          <section className="home-transactions">
            <h2 className="section-title">รายการวันนี้</h2>
            <TransactionList
              transactions={summary.transactions}
              onDelete={handleDelete}
            />
          </section>
        </div>
      )}
    </div>
  );
}
