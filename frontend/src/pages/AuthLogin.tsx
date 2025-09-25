import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import { useAuth } from '../context/AuthContext';

const AuthLogin: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('admin123');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const u = await handleLogin(username, password);
      if ((u as any).role === 'admin') {
        // Chặn admin đăng nhập tại public site
        setError('Tài khoản admin phải đăng nhập tại trang quản trị.');
        navigate('/admin/login', { replace: true });
        return;
      }
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-md mx-auto px-4 py-6">
        <Breadcrumb />
        <h1 className="text-2xl font-semibold text-center">Đăng nhập Khách hàng</h1>
        <form className="mt-4 space-y-3 bg-white rounded-xl shadow p-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-600">Tên đăng nhập</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="text-xs text-gray-600">Lưu ý: Admin/Staff vui lòng dùng trang đăng nhập riêng.</div>
          <button disabled={loading} type="submit" className="w-full rounded-lg bg-indigo-600 text-white py-2">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default AuthLogin;


