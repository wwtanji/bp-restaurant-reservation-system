import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_ROLE } from '../../constants/admin';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ot-charade"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== ADMIN_ROLE) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
