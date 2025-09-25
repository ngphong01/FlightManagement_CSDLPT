import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
  const location = useLocation();
  const active = location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`block rounded px-3 py-2 text-sm ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
      aria-label={label}
    >
      {label}
    </Link>
  );
};

const AdminSidebar: React.FC = () => {
  return (
    <aside className="w-56 bg-white border-r min-h-screen p-3 space-y-1">
      <div className="text-xs font-semibold text-gray-500 mb-2 px-1">Admin</div>
      <NavLink to="/admin/dashboard" label="Dashboard" />
      <NavLink to="/admin/flights" label="Chuyến bay" />
      <NavLink to="/admin/bookings" label="Đặt chỗ" />
      <NavLink to="/admin/users" label="Người dùng" />
      <NavLink to="/admin/staff" label="Nhân viên" />
      <NavLink to="/admin/reports" label="Báo cáo" />
      <NavLink to="/admin/system" label="Hệ thống" />
    </aside>
  );
};

export default AdminSidebar;

