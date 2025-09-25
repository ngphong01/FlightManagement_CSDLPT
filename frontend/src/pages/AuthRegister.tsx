import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';

const AuthRegister: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ username: '', password: '', confirm: '' });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) return setError('Vui lòng nhập đầy đủ');
    if (form.password !== form.confirm) return setError('Mật khẩu không khớp');
    alert('Đăng ký demo thành công');
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-md mx-auto px-4 py-6">
        <Breadcrumb />
        <h1 className="text-2xl font-semibold text-center">Đăng ký</h1>
        <form className="mt-4 space-y-3 bg-white rounded-xl shadow p-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-gray-600">Tên đăng nhập</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Mật khẩu</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Xác nhận mật khẩu</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full rounded-lg bg-indigo-600 text-white py-2">Đăng ký</button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default AuthRegister;


