import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Spinner component
const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Requires authentication
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
};

// Requires admin role
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

// Redirect if already logged in
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) return <Spinner />;
  if (token && user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};
