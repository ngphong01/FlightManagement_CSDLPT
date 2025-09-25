import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavLink: React.FC<{ to: string; label: string; icon?: string }> = ({ to, label, icon }) => {
  const location = useLocation();
  const active = location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 rounded px-3 py-2 text-sm ${
        active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
      }`}
      aria-label={label}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
};

const StaffSidebar: React.FC = () => {
  return (
    <aside className="w-56 bg-white border-r min-h-screen p-3 space-y-1">
      <div className="text-xs font-semibold text-gray-500 mb-2 px-1">Nhân viên</div>
      <NavLink to="/staff/checkin" label="Check-in" icon="🛂" />
      <NavLink to="/staff/gate" label="Cổng ra máy bay" icon="🚪" />
      <NavLink to="/staff/emergency" label="Dashboard Khẩn cấp" icon="🚨" />
      <NavLink to="/staff/test" label="Test Page" icon="🧪" />
    </aside>
  );
};

export default StaffSidebar;


