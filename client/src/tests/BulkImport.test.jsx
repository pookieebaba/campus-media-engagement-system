import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { _id: 'head001', name: 'Head Admin', role: 'head' },
  }),
  AuthProvider: ({ children }) => children,
}));

// ─── Mock Toast ───────────────────────────────────────────────────────────────
vi.mock('../components/ui/Toast.jsx', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
  ToastProvider: ({ children }) => children,
}));

// ─── Mock user API ────────────────────────────────────────────────────────────
vi.mock('../api/user.api.js', () => ({
  bulkImport: vi.fn(),
}));

import { bulkImport } from '../api/user.api.js';
import { BulkImportPage } from '../pages/head/BulkImportPage.jsx';

function renderPage() {
  return render(
    <MemoryRouter>
      <BulkImportPage />
    </MemoryRouter>
  );
}

describe('BulkImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders instructions panel', () => {
    renderPage();
    expect(screen.getByText(/CSV Format Requirements/i)).toBeInTheDocument();
    // The instructions list has these column names as required fields
    expect(screen.getAllByText(/studentId/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/blockCode/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/supervisorEmail/).length).toBeGreaterThan(0);
  });

  it('renders file input', () => {
    renderPage();
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.accept).toContain('.csv');
  });

  it('calls bulkImport when form submitted with file', async () => {
    bulkImport.mockResolvedValue({
      data: {
        results: [
          { status: 'created', studentId: 'ET2024001', name: 'John Doe', email: 'john@cmes.edu' },
        ],
      },
    });

    const user = userEvent.setup();
    renderPage();

    const fileInput = document.querySelector('input[type="file"]');
    const csvFile = new File(['name,email,password\nJohn Doe,john@cmes.edu,pass123'], 'students.csv', { type: 'text/csv' });
    await user.upload(fileInput, csvFile);

    const uploadBtn = screen.getByRole('button', { name: /upload and import/i });
    await user.click(uploadBtn);

    await waitFor(() => {
      expect(bulkImport).toHaveBeenCalledTimes(1);
    });
    // Verify FormData was passed
    const callArg = bulkImport.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(FormData);
  });

  it('shows results DataTable after successful response', async () => {
    bulkImport.mockResolvedValue({
      data: {
        results: [
          { status: 'created', studentId: 'ET2024001', name: 'John Doe', email: 'john@cmes.edu' },
          { status: 'failed', studentId: 'ET2024002', name: 'Jane Doe', email: 'jane@cmes.edu', error: 'Duplicate email' },
        ],
      },
    });

    const user = userEvent.setup();
    renderPage();

    const fileInput = document.querySelector('input[type="file"]');
    const csvFile = new File(['name,email\nJohn Doe,john@cmes.edu'], 'students.csv', { type: 'text/csv' });
    await user.upload(fileInput, csvFile);

    const uploadBtn = screen.getByRole('button', { name: /upload and import/i });
    await user.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText('1 Created')).toBeInTheDocument();
      expect(screen.getByText('1 Failed')).toBeInTheDocument();
    });
  });
});
