import { TrendingUp, TrendingDown, X, Inbox } from 'lucide-react';
import { Transaction, CATEGORY_LABELS } from '../types/transaction';
import { formatMoney, formatThaiDate } from '../utils/date';
import './TransactionList.css';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="transaction-empty">
        <Inbox size={64} strokeWidth={1} />
        <p>ยังไม่มีรายการ</p>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      {transactions.map((tx) => (
        <div key={tx._id} className={`transaction-item ${tx.type}`}>
          <div className="transaction-icon">
            {tx.type === 'income' ? (
              <TrendingUp size={24} />
            ) : (
              <TrendingDown size={24} />
            )}
          </div>
          
          <div className="transaction-info">
            <div className="transaction-type">
              <span>{tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span>
              {tx.category && (
                <span className="transaction-category">
                  ({CATEGORY_LABELS[tx.category]})
                </span>
              )}
            </div>
            <div className="transaction-date">{formatThaiDate(tx.date)}</div>
            {tx.note && <div className="transaction-note">{tx.note}</div>}
          </div>
          
          <div className="transaction-right">
            <div className={`transaction-amount ${tx.type}`}>
              {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
            </div>
            {onDelete && (
              <button
                className="transaction-delete"
                onClick={() => onDelete(tx._id)}
                title="ลบรายการ"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
