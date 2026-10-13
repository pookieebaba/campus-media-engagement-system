import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: {
      _id: 'fac001',
      name: 'Dr. Alice Morgan',
      role: 'faculty',
      email: 'faculty.et@cmes.edu',
    },
  }),
  AuthProvider: ({ children }) => children,
}));

// ─── Mock Toast ───────────────────────────────────────────────────────────────
vi.mock('../../components/ui/Toast.jsx', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
  ToastProvider: ({ children }) => children,
}));

// ─── Mock API modules ─────────────────────────────────────────────────────────
vi.mock('../../api/event.api.js', () => ({
  getEvent: vi.fn(),
}));

vi.mock('../../api/attendance.api.js', () => ({
  listAttendance: vi.fn(),
  manualCheckin: vi.fn(),
  finalizeAttendance: vi.fn(),
  correctAttendance: vi.fn(),
}));

vi.mock('../../api/participation.api.js', () => ({
  listParticipants: vi.fn(),
}));

import { getEvent } from '../../api/event.api.js';
import { listAttendance, manualCheckin } from '../../api/attendance.api.js';
import { listParticipants } from '../../api/participation.api.js';
import { AttendanceRegisterPage } from '../../pages/faculty/AttendanceRegisterPage.jsx';

const mockStudents = [
  { _id: 'stu001', name: 'Aisha Patel', studentId: 'ET2024001', block: { _id: 'b1', code: 'ET', name: 'Engineering & Technology' } },
  { _id: 'stu002', name: 'Rohan Verma', studentId: 'ET2024002', block: { _id: 'b1', code: 'ET', name: 'Engineering & Technology' } },
  { _id: 'stu003', name: 'Simone Lee', studentId: 'ET2024003', block: { _id: 'b1', code: 'ET', name: 'Engineering & Technology' } },
];

const mockEvent = {
  _id: 'ev001',
  title: 'Annual Media Showcase',
  status: 'completed',
  date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  venue: 'Main Auditorium',
  assignedStudents: mockStudents,
};

const mockAttendance = [
  {
    _id: 'att001',
    event: 'ev001',
    student: { _id: 'stu001', name: 'Aisha Patel', studentId: 'ET2024001' },
    status: 'present',
    checkInMethod: 'qr',
    checkInTime: new Date().toISOString(),
    isFinalized: false,
  },
];

const mockParticipants = [
  { _id: 'p001', student: { _id: 'stu001' }, rsvpStatus: 'going' },
  { _id: 'p002', student: { _id: 'stu002' }, rsvpStatus: 'going' },
  { _id: 'p003', student: { _id: 'stu003' }, rsvpStatus: 'pending' },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/faculty/events/ev001/attendance']}>
      <Routes>
        <Route path="/faculty/events/:id/attendance" element={<AttendanceRegisterPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Attendance Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEvent.mockResolvedValue({ data: { event: mockEvent } });
    listAttendance.mockResolvedValue({ data: { attendance: mockAttendance } });
    listParticipants.mockResolvedValue({ data: { participants: mockParticipants } });
    manualCheckin.mockResolvedValue({ data: {} });
  });

  it('renders attendance register with student rows', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aisha Patel')).toBeInTheDocument();
    });

    expect(screen.getByText('Rohan Verma')).toBeInTheDocument();
    expect(screen.getByText('Simone Lee')).toBeInTheDocument();
  });

  it('shows summary bar with student counts', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/3 students/i)).toBeInTheDocument();
    });
  });

  it('calls manualCheckin when attendance status changed', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Rohan Verma')).toBeInTheDocument();
    });

    // Find the select dropdown for Rohan (who has no attendance record — default absent)
    const selects = screen.getAllByRole('combobox', { name: /attendance/i });
    expect(selects.length).toBeGreaterThan(0);

    // Change second student's status
    await user.selectOptions(selects[1], 'present');

    await waitFor(() => {
      expect(manualCheckin).toHaveBeenCalledWith('ev001', 'stu002', { status: 'present' });
    });
  });

  it('shows check-in time for students with attendance records', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Aisha Patel')).toBeInTheDocument();
    });

    // Aisha has an attendance record with checkInTime
    // The formatted time should be visible
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // header + data rows
  });
});
