import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { ExpenseCategory, CATEGORY_LABELS } from '../types/transaction';
import { Input, Select, TextArea } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { getToday } from '../utils/date';
import './FormPage.css';

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function Expense() {
  const navigate = useNavigate();
  const { currentStore } = useAuth();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStore) {
      setError('กรุณาเลือกร้านค้าก่อน');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError('กรุณาใส่จำนวนเงิน');
      return;
    }

    if (!category) {
      setError('กรุณาเลือกประเภท');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await api.createTransaction({
        type: 'expense',
        amount: Number(amount),
        category,
        date,
        note: note || undefined,
      });

      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="form-success">
        <CheckCircle size={80} className="success-icon" />
        <h2>บันทึกสำเร็จ!</h2>
        <p>กำลังกลับหน้าหลัก...</p>
      </div>
    );
  }

  // ถ้ายังไม่มีร้าน
  if (!currentStore) {
    return (
      <div className="form-page">
        <div className="form-no-store">
          <AlertTriangle size={64} className="no-store-icon" />
          <h2>ไม่มีร้านค้า</h2>
          <p>กรุณาเลือกร้านค้าก่อนเพิ่มรายการ</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <header className="form-header expense">
        <div className="form-header-icon">
          <TrendingDown size={32} />
        </div>
        <div className="form-header-info">
          <h1 className="form-title">เพิ่มรายจ่าย</h1>
          <p className="form-subtitle">{currentStore.name}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="form-card">
        {error && (
          <div className="message message-error mb-md">{error}</div>
        )}

        <Input
          label="จำนวนเงิน (บาท)"
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          autoFocus
        />

        <Select
          label="ประเภท"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
        />

        <Input
          label="วันที่"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <TextArea
          label="หมายเหตุ (ไม่บังคับ)"
          placeholder="เช่น ซื้อข้าวสาร 10 กก."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="expense"
            loading={loading}
          >
            บันทึก
          </Button>
        </div>
      </form>
    </div>
  );
}
