import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicRoute } from './components/shared/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import MyAttendancePage from './pages/user/MyAttendancePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import QRScannerPage from './pages/admin/QRScannerPage';
import AttendanceRecordsPage from './pages/admin/AttendanceRecordsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import PendingApprovalsPage from './pages/admin/PendingApprovalsPage';

import NotFoundPage from './pages/NotFoundPage';

// Root redirect based on auth state
const RootRedirect: React.FC = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Root */}
    <Route path="/" element={<RootRedirect />} />

    {/* Public Auth Routes */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      }
    />

    {/* User Protected Routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <UserDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/attendance"
      element={
        <ProtectedRoute>
          <MyAttendancePage />
        </ProtectedRoute>
      }
    />

    {/* Admin Protected Routes */}
    <Route
      path="/admin/dashboard"
      element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/scanner"
      element={
        <AdminRoute>
          <QRScannerPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/attendance"
      element={
        <AdminRoute>
          <AttendanceRecordsPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <AdminRoute>
          <UserManagementPage />
        </AdminRoute>
      }
    />
    <Route
      path="/admin/pending"
      element={
        <AdminRoute>
          <PendingApprovalsPage />
        </AdminRoute>
      }
    />

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#1e3a8a',
              color: '#fff',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
