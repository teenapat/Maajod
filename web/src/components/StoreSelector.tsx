import { ChevronDown, Store } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './StoreSelector.css';

interface StoreSelectorProps {
  onStoreChange?: () => void;
}

export function StoreSelector({ onStoreChange }: StoreSelectorProps) {
  const { stores, currentStore, switchStore } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (storeId: string) => {
    switchStore(storeId);
    setIsOpen(false);
    onStoreChange?.();
  };

  if (stores.length === 0) {
    return null;
  }

  // ถ้ามีร้านเดียว แสดงแค่ชื่อร้าน ไม่ต้องเป็น dropdown
  if (stores.length === 1) {
    return (
      <div className="store-selector single">
        <Store size={18} />
        <span className="store-name">{currentStore?.name}</span>
      </div>
    );
  }

  return (
    <div className="store-selector" ref={dropdownRef}>
      <button
        className={`store-selector-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Store size={18} />
        <span className="store-name">{currentStore?.name || 'เลือกร้าน'}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="store-dropdown">
          {stores.map((store) => (
            <button
              key={store._id}
              className={`store-option ${store._id === currentStore?._id ? 'active' : ''}`}
              onClick={() => handleSelect(store._id)}
            >
              <span className="store-option-name">{store.name}</span>
              {store.isDefault && <span className="store-badge">Default</span>}
              <span className={`store-role ${store.userRole}`}>
                {store.userRole === 'owner' ? 'เจ้าของ' : store.userRole === 'admin' ? 'ผู้ดูแล' : 'สมาชิก'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

