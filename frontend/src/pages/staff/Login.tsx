import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';

const StaffLogin: React.FC = () => {
  const navigate = useNavigate();
  const { staffLogin } = useStaffAuth();
  const [form, setForm] = React.useState({ username: '', password: '', role: 'checkin' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Nhập đầy đủ thông tin'); return; }
    setLoading(true); setError(null);
    try {
      // Gọi staff auth endpoint riêng (employeeCode = username)
      const res = await fetch(`${(window as any).API_BASE || 'http://localhost:3001'}/api/staff/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeCode: form.username, password: form.password })
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err?.error || 'Đăng nhập thất bại'); }
      const data = await res.json();
      staffLogin({ id: data?.user?.id, employeeCode: data?.user?.username, role: data?.user?.role, site: data?.user?.region }, data?.token);
      navigate(form.role === 'gate' ? '/staff/gate' : '/staff/checkin', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6">
        <h1 className="text-lg font-semibold mb-4">Hệ thống Nhân viên Sân bay</h1>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block mb-1">Mã nhân viên</label>
            <input className="w-full border rounded px-3 py-2" value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} />
          </div>
          <div>
            <label className="block mb-1">Mật khẩu</label>
            <input type="password" className="w-full border rounded px-3 py-2" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} />
          </div>
          <div>
            <label className="block mb-1">Vị trí</label>
            <select className="w-full border rounded px-3 py-2" value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
              <option value="checkin">Quầy check-in</option>
              <option value="gate">Cổng ra máy bay (Gate)</option>
              <option value="support">Quầy hỗ trợ</option>
            </select>
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white rounded px-3 py-2">{loading?'Đang đăng nhập...':'Đăng nhập'}</button>
        </form>
      </div>
    </div>
  );
};

export default StaffLogin;

