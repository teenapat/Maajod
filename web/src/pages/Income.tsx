import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { getToday } from '../utils/date';
import './FormPage.css';

export function Income() {
  const navigate = useNavigate();
  const { currentStore } = useAuth();
  const [amount, setAmount] = useState('');
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

    try {
      setLoading(true);
      setError('');

      await api.createTransaction({
        type: 'income',
        amount: Number(amount),
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
      <header className="form-header income">
        <div className="form-header-icon">
          <TrendingUp size={32} />
        </div>
        <div className="form-header-info">
          <h1 className="form-title">เพิ่มรายรับ</h1>
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

        <Input
          label="วันที่"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <TextArea
          label="หมายเหตุ (ไม่บังคับ)"
          placeholder="เช่น ข้าวผัด 2 จาน"
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
            variant="income"
            loading={loading}
          >
            บันทึก
          </Button>
        </div>
      </form>
    </div>
  );
}
