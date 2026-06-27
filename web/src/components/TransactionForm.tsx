import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { CATEGORY_LABELS, ExpenseCategory, TransactionType } from '../types/transaction';
import { getToday } from '../utils/date';
import { Button } from './Button';
import { Input, Select, TextArea } from './Input';
import '../pages/FormPage.css';

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface TransactionFormProps {
  type: TransactionType;
  onSuccess: () => void;
  onCancel: () => void;
  /** โหมด modal: ไม่แสดงหัว + ไม่มี label (ใช้ placeholder) */
  compact?: boolean;
}

export function TransactionForm({ type, onSuccess, onCancel, compact = false }: TransactionFormProps) {
  const { currentStore } = useAuth();
  const isIncome = type === 'income';

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // กันค่าติดลบ: ตัดเครื่องหมายลบและอักขระที่ไม่ใช่ตัวเลข/จุดทศนิยมออก
    const sanitized = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(sanitized);
  };

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

    if (!isIncome && !category) {
      setError('กรุณาเลือกประเภท');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.createTransaction({
        type,
        amount: Number(amount),
        category: isIncome ? undefined : (category as ExpenseCategory),
        date,
        note: note || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="form-success">
        <CheckCircle size={72} className="success-icon" />
        <h2>บันทึกสำเร็จ!</h2>
        <p>{isIncome ? 'เพิ่มรายรับเรียบร้อย' : 'เพิ่มรายจ่ายเรียบร้อย'}</p>
      </div>
    );
  }

  return (
    <div className="transaction-form">
      <form onSubmit={handleSubmit} className="form-card">
        {error && <div className="message message-error mb-md">{error}</div>}

        <Input
          label={compact ? undefined : 'จำนวนเงิน (บาท)'}
          type="number"
          placeholder={compact ? 'จำนวนเงิน (บาท)' : '0'}
          aria-label="จำนวนเงิน (บาท)"
          value={amount}
          onChange={handleAmountChange}
          inputMode="decimal"
          min={0}
          step="any"
          autoFocus
        />

        {!isIncome && (
          <Select
            label={compact ? undefined : 'ประเภท'}
            aria-label="ประเภท"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          />
        )}

        <Input
          label={compact ? undefined : 'วันที่'}
          type="date"
          aria-label="วันที่"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <TextArea
          label={compact ? undefined : 'หมายเหตุ (ไม่บังคับ)'}
          placeholder={isIncome ? 'หมายเหตุ เช่น ข้าวผัด 2 จาน' : 'หมายเหตุ เช่น ซื้อข้าวสาร 10 กก.'}
          aria-label="หมายเหตุ"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="form-actions">
          <Button type="button" variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button type="submit" variant={isIncome ? 'income' : 'expense'} loading={loading}>
            บันทึก
          </Button>
        </div>
      </form>
    </div>
  );
}
