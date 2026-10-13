import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

import { useAuth } from '../context/AuthContext.jsx';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';

function renderWithRouter(authState, path = '/protected', allowedRoles = ['head']) {
  useAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: authState.isAuthenticated ?? false,
    user: authState.user ?? null,
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/head/dashboard" element={<div>Head Dashboard</div>} />
        <Route path="/faculty/dashboard" element={<div>Faculty Dashboard</div>} />
        <Route path="/student/dashboard" element={<div>Student Dashboard</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when not authenticated', () => {
    renderWithRouter({ isAuthenticated: false, user: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when role matches allowedRoles', () => {
    renderWithRouter({ isAuthenticated: true, user: { role: 'head' } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects student to /student/dashboard when trying to access head route', () => {
    renderWithRouter(
      { isAuthenticated: true, user: { role: 'student' } },
      '/protected',
      ['head']
    );
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
