import { TrendingDown, TrendingUp, X } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionModal } from '../contexts/TransactionModalContext';
import { TransactionForm } from './TransactionForm';
import './TransactionModal.css';

export function TransactionModal() {
  const { isOpen, type, closeModal, notifyChange } = useTransactionModal();
  const { currentStore } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKey);

    // Lock scroll โดยไม่เลื่อน body ออกจาก viewport
    // (ถ้าใช้ position:fixed + top ลบ scrollY เนื้อหาจะหาย → backdrop-filter เบลอไม่ได้ → เห็นพื้นหลังขาว)
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';

    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as Node;
      const modalBody = document.querySelector('.tx-modal-body');
      if (modalBody?.contains(target)) return;
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('touchmove', preventTouchMove);
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.touchAction = prev.bodyTouchAction;
    };
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    notifyChange();
    closeModal();
  };

  const isIncome = type === 'income';

  return (
    <div className="tx-modal-backdrop" onClick={closeModal} role="dialog" aria-modal="true">
      <div className="tx-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className={`tx-modal-header ${type}`}>
          <div className="tx-modal-header-left">
            <span className="tx-modal-header-icon">
              {isIncome ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </span>
            <span className="tx-modal-header-title">{currentStore?.name ?? ''}</span>
          </div>
          <button type="button" className="tx-modal-close" onClick={closeModal} aria-label="ปิด">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="tx-modal-body">
          <TransactionForm type={type} compact onSuccess={handleSuccess} onCancel={closeModal} />
        </div>
      </div>
    </div>
  );
}
