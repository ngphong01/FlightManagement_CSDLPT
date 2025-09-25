import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('admin123');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const u = await handleLogin(username, password);
      if (u.role !== 'admin') {
        setError('Tài khoản này không có quyền Admin.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Đăng nhập thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <div className="text-lg font-semibold">⚠️ HỆ THỐNG QUẢN TRỊ NỘI BỘ</div>
          <div className="text-sm text-gray-600">Chỉ dành cho nhân sự được ủy quyền</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block mb-1">Tên đăng nhập Admin</label>
            <input className="w-full border rounded px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label className="block mb-1">Mật khẩu</label>
            <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="off" />
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white rounded px-3 py-2">{loading? 'Đang đăng nhập...' : 'Đăng nhập Admin'}</button>
        </form>
        <div className="text-xs text-gray-500">🔒 Kết nối được mã hóa. Vui lòng bảo mật thông tin đăng nhập.</div>
      </div>
    </div>
  );
};

export default AdminLogin;


