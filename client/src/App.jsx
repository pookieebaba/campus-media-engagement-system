import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { LoadingSpinner } from './components/ui/LoadingSpinner.jsx';

// ─── Auth pages (small, not lazy-loaded) ───────────────────────────────────
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

// ─── Head pages ─────────────────────────────────────────────────────────────
import { HeadDashboardPage } from './pages/head/HeadDashboardPage.jsx';
import { HeadEventsPage } from './pages/head/HeadEventsPage.jsx';
import { CreateEditEventPage } from './pages/head/CreateEditEventPage.jsx';
import { HeadEventDetailPage } from './pages/head/HeadEventDetailPage.jsx';
import { HeadBlocksPage } from './pages/head/HeadBlocksPage.jsx';
import { HeadStudentsPage } from './pages/head/HeadStudentsPage.jsx';
import { StudentDetailPage } from './pages/head/StudentDetailPage.jsx';
import { BulkImportPage } from './pages/head/BulkImportPage.jsx';
import { HeadFacultyPage } from './pages/head/HeadFacultyPage.jsx';
import { FacultyDetailPage } from './pages/head/FacultyDetailPage.jsx';
import { AttendanceOverviewPage } from './pages/head/AttendanceOverviewPage.jsx';
import { ReportsPage } from './pages/head/ReportsPage.jsx';
import { NotificationsPage } from './pages/head/NotificationsPage.jsx';
import { AuditLogsPage } from './pages/head/AuditLogsPage.jsx';
import { SettingsPage } from './pages/head/SettingsPage.jsx';

// ─── Faculty pages ──────────────────────────────────────────────────────────
import { FacultyDashboardPage } from './pages/faculty/FacultyDashboardPage.jsx';

// ─── Student pages ──────────────────────────────────────────────────────────
import { StudentDashboardPage } from './pages/student/StudentDashboardPage.jsx';

// ─── Role-based root redirect ────────────────────────────────────────────────
function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const dashboards = {
    head: '/head/dashboard',
    faculty: '/faculty/dashboard',
    student: '/student/dashboard',
  };
  return <Navigate to={dashboards[user?.role] ?? '/login'} replace />;
}

// ─── Placeholder for pages coming in later FEATs ─────────────────────────────
function Placeholder({ label }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="font-body text-foreground/40 text-sm">{label} — coming soon</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* ── HEAD routes ─────────────────────────────────────────────── */}
            <Route
              path="/head/dashboard"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <HeadDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/events"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <HeadEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/events/new"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <CreateEditEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/events/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <CreateEditEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/events/:id"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <HeadEventDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/blocks"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <HeadBlocksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/students/import"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <BulkImportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/students/:id"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <StudentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/students"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <HeadStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/faculty/:id"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <FacultyDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/faculty"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <HeadFacultyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/attendance"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <AttendanceOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/reports"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/notifications"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head/settings"
              element={
                <ProtectedRoute allowedRoles={['head']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* ── FACULTY routes ───────────────────────────────────────────── */}
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/events"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <Placeholder label="Faculty Events" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/events/:id"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <Placeholder label="Faculty Event Detail" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/events/:id/attendance"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <Placeholder label="Manage Attendance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/events/:id/qr"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <Placeholder label="QR Code" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/students"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <Placeholder label="My Students" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/announcements"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <Placeholder label="Announcements" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/notifications"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <Placeholder label="Faculty Notifications" />
                </ProtectedRoute>
              }
            />

            {/* ── STUDENT routes ───────────────────────────────────────────── */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/events"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Placeholder label="Student Events" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/events/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Placeholder label="Event Detail" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/participation"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Placeholder label="My Participation" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Placeholder label="Attendance History" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Placeholder label="Student Notifications" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Placeholder label="Profile" />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
