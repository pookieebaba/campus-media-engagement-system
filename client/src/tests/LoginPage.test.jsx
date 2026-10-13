import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mock auth context ───────────────────────────────────────────────────────
const mockLogin = vi.fn();

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    isAuthenticated: false,
    user: null,
  }),
  AuthProvider: ({ children }) => children,
}));

// ─── Mock react-router-dom navigate ─────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { LoginPage } from '../pages/auth/LoginPage.jsx';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /campus media engagement/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot your password/i })).toBeInTheDocument();
  });

  it('shows a validation error when submitted with empty fields', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /please enter your email and password/i
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows an error message on 401 invalid credentials', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Invalid credentials. Please try again.' } },
    });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'wrong@cmes.edu');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects to head dashboard on successful head login', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'head', name: 'Head Admin', email: 'head@cmes.edu' });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'head@cmes.edu');
    await user.type(screen.getByLabelText(/password/i), 'Head@2024!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/head/dashboard', { replace: true });
    });
  });

  it('redirects to faculty dashboard on successful faculty login', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'faculty', name: 'Faculty ET', email: 'faculty.et@cmes.edu' });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'faculty.et@cmes.edu');
    await user.type(screen.getByLabelText(/password/i), 'Faculty@2024!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/faculty/dashboard', { replace: true });
    });
  });

  it('redirects to student dashboard on successful student login', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'student', name: 'Test Student', email: 'ET2024001@student.cmes.edu' });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'ET2024001@student.cmes.edu');
    await user.type(screen.getByLabelText(/password/i), 'Student@2024!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/student/dashboard', { replace: true });
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows a generic error when login throws without response data', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network Error'));

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'head@cmes.edu');
    await user.type(screen.getByLabelText(/password/i), 'Head@2024!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials. please try again/i);
  });
});
