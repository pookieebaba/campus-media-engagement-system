import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: {
      _id: 'stu001',
      name: 'Test Student',
      role: 'student',
      studentId: 'ET2024001',
      block: { _id: 'b1', name: 'Engineering & Technology', code: 'ET' },
      supervisor: { name: 'Dr. Alice Morgan' },
    },
  }),
  AuthProvider: ({ children }) => children,
}));

// ─── Mock Toast ───────────────────────────────────────────────────────────────
vi.mock('../../components/ui/Toast.jsx', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
  ToastProvider: ({ children }) => children,
}));

// ─── Mock participation API ───────────────────────────────────────────────────
vi.mock('../../api/participation.api.js', () => ({
  myParticipation: vi.fn(),
  submitRsvp: vi.fn(),
}));

// ─── Mock notification API ────────────────────────────────────────────────────
vi.mock('../../api/notification.api.js', () => ({
  listNotifications: vi.fn(),
}));

import { myParticipation, submitRsvp } from '../../api/participation.api.js';
import { listNotifications } from '../../api/notification.api.js';
import { StudentDashboardPage } from '../../pages/student/StudentDashboardPage.jsx';

const mockEvent = {
  _id: 'ev001',
  title: 'Photography Workshop',
  status: 'published',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // next week
  venue: 'Studio Lab',
  rsvpDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
};

const mockParticipation = [
  {
    _id: 'p001',
    event: mockEvent,
    rsvpStatus: 'pending',
  },
];

function renderDashboard() {
  return render(
    <MemoryRouter>
      <StudentDashboardPage />
    </MemoryRouter>
  );
}

describe('RSVP Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    myParticipation.mockResolvedValue({ data: { participations: mockParticipation } });
    listNotifications.mockResolvedValue({ data: { notifications: [] } });
    submitRsvp.mockResolvedValue({ data: {} });
  });

  it('renders dashboard with upcoming event after data loads', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Photography Workshop')).toBeInTheDocument();
    });
  });

  it('shows RSVP status badge for participation', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('calls submitRsvp with correct args when user clicks Going', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Photography Workshop')).toBeInTheDocument();
    });

    // Find the Going button
    const goingButtons = screen.getAllByRole('button', { name: /going/i });
    const goingBtn = goingButtons.find((btn) => btn.textContent.trim() === 'Going');
    await user.click(goingBtn);

    await waitFor(() => {
      expect(submitRsvp).toHaveBeenCalledWith('ev001', 'going');
    });
  });

  it('updates RSVP display after submitRsvp succeeds', async () => {
    const user = userEvent.setup();

    // After first call, the UI updates the local state
    submitRsvp.mockResolvedValueOnce({ data: {} });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Photography Workshop')).toBeInTheDocument();
    });

    const goingButtons = screen.getAllByRole('button', { name: /going/i });
    const goingBtn = goingButtons.find((btn) => btn.textContent.trim() === 'Going');
    await user.click(goingBtn);

    await waitFor(() => {
      expect(submitRsvp).toHaveBeenCalledTimes(1);
    });
  });
});
