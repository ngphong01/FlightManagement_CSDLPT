import React from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from './StaffSidebar';

const StaffLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <StaffSidebar />
      <div className="flex-1 flex flex-col">
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
