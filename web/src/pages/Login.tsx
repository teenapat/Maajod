import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError('กรุณาใส่ username และ password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Receipt size={48} />
          </div>
          <h1 className="login-title">แม่จดเงิน</h1>
          <p className="login-subtitle">เข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="message message-error">{error}</div>
          )}

          <Input
            label="Username"
            type="text"
            placeholder="ใส่ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            placeholder="ใส่รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Button type="submit" variant="primary" fullWidth loading={loading}>
            {loading ? <Loader2 className="spinner-icon" size={20} /> : <LogIn size={20} />}
            เข้าสู่ระบบ
          </Button>
        </form>
      </div>
    </div>
  );
}
