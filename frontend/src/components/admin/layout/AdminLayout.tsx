import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopNav from './AdminTopNav';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  React.useEffect(() => {
    // Auto-logout admin after 15 minutes of inactivity
    const INACTIVE_MS = 15 * 60 * 1000;
    let timer: any;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try { handleLogout(); } catch {}
        alert('Phiên Admin đã hết hạn do không hoạt động. Vui lòng đăng nhập lại.');
        navigate('/admin/login', { replace: true });
      }, INACTIVE_MS);
    };
    const events = ['mousemove','keypress','click','scroll'];
    events.forEach(e => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [handleLogout, navigate]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminTopNav />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

