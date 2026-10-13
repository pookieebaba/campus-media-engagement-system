import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mock recharts ────────────────────────────────────────────────────────────
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// ─── Mock AuthContext ─────────────────────────────────────────────────────────
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { _id: 'head001', name: 'Head Admin', role: 'head', email: 'head@cmes.edu' },
  }),
  AuthProvider: ({ children }) => children,
}));

// ─── Mock Toast ───────────────────────────────────────────────────────────────
vi.mock('../components/ui/Toast.jsx', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
  ToastProvider: ({ children }) => children,
}));

// ─── Mock API modules ─────────────────────────────────────────────────────────
vi.mock('../api/user.api.js', () => ({
  listUsers: vi.fn(),
}));
vi.mock('../api/event.api.js', () => ({
  listEvents: vi.fn(),
}));
vi.mock('../api/report.api.js', () => ({
  attendanceReport: vi.fn(),
  participationReport: vi.fn(),
}));
vi.mock('../api/block.api.js', () => ({
  listBlocks: vi.fn(),
}));
vi.mock('../api/notification.api.js', () => ({
  listNotifications: vi.fn(),
}));

import { listUsers } from '../api/user.api.js';
import { listEvents } from '../api/event.api.js';
import { attendanceReport, participationReport } from '../api/report.api.js';
import { listBlocks } from '../api/block.api.js';
import { HeadDashboardPage } from '../pages/head/HeadDashboardPage.jsx';

const mockStudents = [
  { _id: 's1', name: 'Student One', role: 'student', isActive: true, block: { _id: 'b1', code: 'ET', name: 'ET Block' } },
  { _id: 's2', name: 'Student Two', role: 'student', isActive: true, block: { _id: 'b1', code: 'ET', name: 'ET Block' } },
];
const mockFaculty = [
  { _id: 'f1', name: 'Faculty One', role: 'faculty', isActive: true },
];
const mockBlocks = [
  { _id: 'b1', name: 'ET Block', code: 'ET' },
];
const mockEvents = [
  { _id: 'ev1', title: 'Tech Summit 2025', status: 'published', date: '2025-07-01T00:00:00Z', venue: 'Auditorium' },
];
const mockParticipation = [
  { _id: 'p1', rsvpStatus: 'going', student: { _id: 's1', name: 'Student One', block: { code: 'ET' } } },
  { _id: 'p2', rsvpStatus: 'pending', student: { _id: 's2', name: 'Student Two', block: { code: 'ET' } } },
];
const mockAttendance = [
  { _id: 'a1', status: 'present', student: { _id: 's1', name: 'Student One', block: { code: 'ET' } }, event: { _id: 'ev1', title: 'Tech Summit 2025', date: '2025-07-01T00:00:00Z' } },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <HeadDashboardPage />
    </MemoryRouter>
  );
}

describe('HeadDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUsers.mockImplementation((params) => {
      if (params?.role === 'student') return Promise.resolve({ data: { users: mockStudents } });
      if (params?.role === 'faculty') return Promise.resolve({ data: { users: mockFaculty } });
      return Promise.resolve({ data: [] });
    });
    listBlocks.mockResolvedValue({ data: { blocks: mockBlocks } });
    listEvents.mockResolvedValue({ data: { events: mockEvents } });
    participationReport.mockResolvedValue({ data: { data: mockParticipation } });
    attendanceReport.mockResolvedValue({ data: { data: mockAttendance } });
  });

  it('shows LoadingSpinner initially', () => {
    // All mocks return promises that haven't resolved yet
    listUsers.mockImplementation(() => new Promise(() => {}));
    renderPage();
    // Loading spinner has role="status"
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders 7 StatCards with mocked data after resolve', async () => {
    renderPage();
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    // StatCard labels
    expect(screen.getByText('Active Students')).toBeInTheDocument();
    expect(screen.getByText('Faculty Count')).toBeInTheDocument();
    expect(screen.getByText('Block Count')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
    expect(screen.getByText('Confirmed Participants')).toBeInTheDocument();
    expect(screen.getByText('Actual Attendees')).toBeInTheDocument();
    expect(screen.getByText('Attendance Needing Review')).toBeInTheDocument();
  });

  it('renders chart container after data loads', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    // Chart should be rendered (mocked as responsive-container)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});
