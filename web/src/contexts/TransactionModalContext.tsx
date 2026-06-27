import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { TransactionType } from '../types/transaction';

interface TransactionModalContextType {
  isOpen: boolean;
  type: TransactionType;
  openModal: (type: TransactionType) => void;
  closeModal: () => void;
  // เพิ่มค่าทุกครั้งที่บันทึกสำเร็จ ใช้ให้หน้าอื่นรีเฟรชข้อมูล
  version: number;
  notifyChange: () => void;
}

const TransactionModalContext = createContext<TransactionModalContextType | null>(null);

export function useTransactionModal() {
  const context = useContext(TransactionModalContext);
  if (!context) {
    throw new Error('useTransactionModal must be used within TransactionModalProvider');
  }
  return context;
}

interface ProviderProps {
  children: ReactNode;
}

export function TransactionModalProvider({ children }: ProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('income');
  const [version, setVersion] = useState(0);

  const openModal = useCallback((nextType: TransactionType) => {
    setType(nextType);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const notifyChange = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({ isOpen, type, openModal, closeModal, version, notifyChange }),
    [isOpen, type, openModal, closeModal, version, notifyChange]
  );

  return (
    <TransactionModalContext.Provider value={value}>
      {children}
    </TransactionModalContext.Provider>
  );
}
