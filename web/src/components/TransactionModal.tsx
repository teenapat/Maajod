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

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
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
