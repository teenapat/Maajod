import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatMoney } from '../utils/date';
import './SummaryCard.css';

interface SummaryCardProps {
  totalIncome: number;
  totalExpense: number;
  net: number;
  title?: string;
}

export function SummaryCard({ totalIncome, totalExpense, net, title }: SummaryCardProps) {
  return (
    <div className="summary-card fade-in">
      {title && <h2 className="summary-title">{title}</h2>}
      
      <div className="summary-row">
        <div className="summary-item income">
          <span className="summary-label">
            <TrendingUp size={18} /> รายรับ
          </span>
          <span className="summary-value">{formatMoney(totalIncome)}</span>
        </div>
        
        <div className="summary-item expense">
          <span className="summary-label">
            <TrendingDown size={18} /> รายจ่าย
          </span>
          <span className="summary-value">{formatMoney(totalExpense)}</span>
        </div>
      </div>
      
      <div className={`summary-net ${net >= 0 ? 'positive' : 'negative'}`}>
        <span className="summary-net-label">
          <Wallet size={20} />
          {net >= 0 ? 'กำไร' : 'ขาดทุน'}
        </span>
        <span className="summary-net-value">{formatMoney(Math.abs(net))}</span>
      </div>
    </div>
  );
}
