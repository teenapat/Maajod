import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, LayoutDashboard, LogOut, Receipt, Plus, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactionModal } from '../contexts/TransactionModalContext';
import './NavBar.css';

export function NavBar() {
  const { user, logout } = useAuth();
  const { openModal } = useTransactionModal();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirm('ต้องการออกจากระบบ?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      {/* App title - แสดงเฉพาะ desktop */}
      <div className="nav-app-title">
        <div className="nav-app-logo">
          <Receipt size={24} />
        </div>
        <span className="nav-app-name">แม่จด</span>
      </div>

      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home className="nav-icon" />
        <span className="nav-label">หน้าหลัก</span>
      </NavLink>

      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <CalendarDays className="nav-icon" />
        <span className="nav-label">ย้อนหลัง</span>
      </NavLink>

      {/* ปุ่มเพิ่มรายรับ/รายจ่าย แยกกันชัดเจน กดง่าย (เฉพาะ mobile) */}
      <button
        type="button"
        className="nav-action-btn income"
        onClick={() => openModal('income')}
        aria-label="เพิ่มรายรับ"
      >
        <span className="nav-action-icon">
          <Plus size={26} strokeWidth={3} />
        </span>
        <span className="nav-action-label">รายรับ</span>
      </button>

      <button
        type="button"
        className="nav-action-btn expense"
        onClick={() => openModal('expense')}
        aria-label="เพิ่มรายจ่าย"
      >
        <span className="nav-action-icon">
          <Minus size={26} strokeWidth={3} />
        </span>
        <span className="nav-action-label">รายจ่าย</span>
      </button>

      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard className="nav-icon" />
        <span className="nav-label">ภาพรวม</span>
      </NavLink>

      <button className="nav-item logout" onClick={handleLogout} title={`ออกจากระบบ (${user?.name})`}>
        <LogOut className="nav-icon" />
        <span className="nav-label">ออก</span>
      </button>
    </nav>
  );
}
