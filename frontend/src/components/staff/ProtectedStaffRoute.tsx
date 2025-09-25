import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';

const ProtectedStaffRoute: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  const { staffUser, isLoading } = useStaffAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }
  
  if (!staffUser) return <Navigate to="/staff/login" replace />;
  return <>{children}</>;
};

export default ProtectedStaffRoute;



