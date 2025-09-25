import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const ProtectedAdminRoute: React.FC = () => {
  const { user } = useAuth();
  if (!user || (user as any).role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <AdminLayout />;
};

export default ProtectedAdminRoute;



