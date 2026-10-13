import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingSpinner } from '../ui/LoadingSpinner.jsx';

const ROLE_DASHBOARDS = {
  head: '/head/dashboard',
  faculty: '/faculty/dashboard',
  student: '/student/dashboard',
};

export function ProtectedRoute({ children, allowedRoles }) {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    const dashboard = ROLE_DASHBOARDS[user.role] ?? '/login';
    return <Navigate to={dashboard} replace />;
  }

  return children;
}

export default ProtectedRoute;
