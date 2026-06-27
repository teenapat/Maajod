import { Loader2 } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { TransactionModal } from './components/TransactionModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TransactionModalProvider } from './contexts/TransactionModalContext';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import './styles/global.css';

// Layout สำหรับหน้าที่ต้องล็อกอิน: เนื้อหา + เมนู + modal
function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === '1'
  );

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spinner-icon" size={48} />
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <TransactionModalProvider>
      <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
        <NavBar collapsed={collapsed} onToggle={toggleSidebar} />
        <div className="container">{children}</div>
      </div>
      <TransactionModal />
    </TransactionModalProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
      <Route path="/history" element={<ProtectedLayout><History /></ProtectedLayout>} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      {/* เส้นทางเดิม: แปลงเป็น modal แล้ว จึง redirect กลับหน้าหลัก */}
      <Route path="/income" element={<Navigate to="/" replace />} />
      <Route path="/expense" element={<Navigate to="/" replace />} />
      <Route path="/summary" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
