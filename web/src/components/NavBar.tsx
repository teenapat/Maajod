import { NavLink, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, TrendingDown, CalendarDays, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './NavBar.css';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirm('ต้องการออกจากระบบ?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home className="nav-icon" />
        <span className="nav-label">หน้าหลัก</span>
      </NavLink>
      
      <NavLink to="/income" className={({ isActive }) => `nav-item income ${isActive ? 'active' : ''}`}>
        <TrendingUp className="nav-icon" />
        <span className="nav-label">รายรับ</span>
      </NavLink>
      
      <NavLink to="/expense" className={({ isActive }) => `nav-item expense ${isActive ? 'active' : ''}`}>
        <TrendingDown className="nav-icon" />
        <span className="nav-label">รายจ่าย</span>
      </NavLink>
      
      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <CalendarDays className="nav-icon" />
        <span className="nav-label">ย้อนหลัง</span>
      </NavLink>

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
