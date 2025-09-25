import React from 'react';

const AdminTopNav: React.FC = () => {
  return (
    <header className="h-12 bg-white border-b flex items-center justify-between px-4">
      <div className="font-semibold">Bảng điều khiển Quản trị</div>
      <div className="text-sm text-gray-600">BayNhanh Admin</div>
    </header>
  );
};

export default AdminTopNav;