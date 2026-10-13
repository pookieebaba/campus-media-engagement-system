import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { LoadingSpinner } from './components/ui/LoadingSpinner.jsx';

// ─── Auth pages ─────────────────────────────────────────────────────────────
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

// ─── Faculty pages ───────────────────────────────────────────────────────────
import { FacultyDashboardPage } from './pages/faculty/FacultyDashboardPage.jsx';
import { FacultyEventsPage } from './pages/faculty/FacultyEventsPage.jsx';
import { FacultyEventDetailPage } from './pages/faculty/FacultyEventDetailPage.jsx';
import { AttendanceRegisterPage } from './pages/faculty/AttendanceRegisterPage.jsx';
import { QRAttendancePage } from './pages/faculty/QRAttendancePage.jsx';
import { FacultyStudentsPage } from './pages/faculty/FacultyStudentsPage.jsx';
import { AnnouncementsPage } from './pages/faculty/AnnouncementsPage.jsx';
import { FacultyNotificationsPage } from './pages/faculty/FacultyNotificationsPage.jsx';

// ─── Student pages ───────────────────────────────────────────────────────────
import { StudentDashboardPage } from './pages/student/StudentDashboardPage.jsx';
import { StudentEventsPage } from './pages/student/StudentEventsPage.jsx';
import { StudentEventDetailPage } from './pages/student/StudentEventDetailPage.jsx';
import { QRCheckInPage } from './pages/student/QRCheckInPage.jsx';
import { MyParticipationPage } from './pages/student/MyParticipationPage.jsx';
import { AttendanceHistoryPage } from './pages/student/AttendanceHistoryPage.jsx';
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage.jsx';
import { StudentProfilePage } from './pages/student/StudentProfilePage.jsx';

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
                  <FacultyEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/events/:id/attendance"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <AttendanceRegisterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/events/:id/qr"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <QRAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/events/:id"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyEventDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/students"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/announcements"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/notifications"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyNotificationsPage />
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
                  <StudentEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/events/:id/checkin"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QRCheckInPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/events/:id"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentEventDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/participation"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyParticipationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <AttendanceHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentNotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentProfilePage />
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
