import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { AttendanceStatusBadge } from '../../components/shared/AttendanceStatusBadge.jsx';
import { CorrectAttendanceModal } from '../../components/shared/CorrectAttendanceModal.jsx';
import { ExportButton } from '../../components/shared/ExportButton.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { listEvents } from '../../api/event.api.js';
import { listBlocks } from '../../api/block.api.js';
import { attendanceReport, exportAttendanceCSV } from '../../api/report.api.js';
import { formatDateTime, formatDate } from '../../utils/formatters.js';

export function AttendanceOverviewPage() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [filters, setFilters] = useState({ eventId: '', blockId: '', dateFrom: '', dateTo: '' });
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctModal, setCorrectModal] = useState({ open: false, row: null });

  useEffect(() => {
    document.title = 'Attendance Overview | CMES';
    Promise.all([
      listEvents({ limit: 100 }),
      listBlocks(),
    ])
      .then(([evRes, blRes]) => {
        setEvents(evRes.data?.events ?? evRes.data ?? []);
        setBlocks(blRes.data?.blocks ?? blRes.data ?? []);
      })
      .catch(() => {});
  }, []);

  async function handleApply() {
    setLoading(true);
    try {
      const params = {};
      if (filters.eventId) params.eventId = filters.eventId;
      if (filters.blockId) params.blockId = filters.blockId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const res = await attendanceReport(params);
      setRecords(res.data?.data ?? res.data ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }

  function setFilter(key, value) {
    setFilters((p) => ({ ...p, [key]: value }));
  }

  const data = Array.isArray(records) ? records : [];
  const present = data.filter((r) => r.status === 'present').length;
  const absent = data.filter((r) => r.status === 'absent').length;
  const late = data.filter((r) => r.status === 'late').length;
  const excused = data.filter((r) => r.status === 'excused').length;
  const total = data.length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const columns = [
    {
      key: 'studentId',
      label: 'Student ID',
      render: (_, row) => row.student?.studentId ?? '—',
    },
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => row.student ? (
        <Link to={`/head/students/${row.student._id}`} className="text-moss hover:underline">
          {row.student.name}
        </Link>
      ) : '—',
    },
    {
      key: 'event',
      label: 'Event',
      render: (v, row) => v ? (
        <Link to={`/head/events/${v._id ?? row.event}`} className="text-moss hover:underline">
          {v.title ?? v}
        </Link>
      ) : '—',
    },
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => formatDate(row.event?.date),
    },
    { key: 'status', label: 'Status', render: (v) => <AttendanceStatusBadge status={v} /> },
    { key: 'checkInMethod', label: 'Method', render: (v) => v ?? '—' },
    { key: 'checkInTime', label: 'Check-in Time', render: (v) => formatDateTime(v) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => setCorrectModal({ open: true, row })}>
          Correct
        </Button>
      ),
    },
  ];

  return (
    <AppShell title="Attendance Overview">
      <div className="flex flex-col gap-6">
        {/* Filter Card */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Event"
              value={filters.eventId}
              onChange={(e) => setFilter('eventId', e.target.value)}
            >
              <option value="">All Events</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </Select>
            <Select
              label="Block"
              value={filters.blockId}
              onChange={(e) => setFilter('blockId', e.target.value)}
            >
              <option value="">All Blocks</option>
              {blocks.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </Select>
            <Input
              label="Date From"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value)}
            />
            <Input
              label="Date To"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Button variant="primary" onClick={handleApply} loading={loading}>
              Apply Filters
            </Button>
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : records !== null && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Expected', value: total, color: 'text-foreground' },
                { label: 'Present', value: present, color: 'text-moss' },
                { label: 'Absent', value: absent, color: 'text-destructive' },
                { label: 'Late', value: late, color: 'text-terracotta' },
                { label: 'Excused', value: excused, color: 'text-foreground/60' },
                { label: 'Rate', value: `${rate}%`, color: 'text-moss' },
              ].map(({ label, value, color }) => (
                <Card key={label} className="p-4">
                  <p className="text-xs font-body text-foreground/60 uppercase">{label}</p>
                  <p className={`font-heading text-2xl font-semibold ${color}`}>{value}</p>
                </Card>
              ))}
            </div>

            {/* Export */}
            <div className="flex justify-end">
              <ExportButton
                onExport={() => exportAttendanceCSV({
                  eventId: filters.eventId || undefined,
                  blockId: filters.blockId || undefined,
                  dateFrom: filters.dateFrom || undefined,
                  dateTo: filters.dateTo || undefined,
                }).then((r) => r.data)}
                filename="attendance-overview.csv"
              >
                Export CSV
              </ExportButton>
            </div>

            <DataTable
              columns={columns}
              data={data}
              emptyTitle="No attendance records found"
              emptyDescription="Adjust your filters and try again"
            />
          </>
        )}
      </div>

      <CorrectAttendanceModal
        isOpen={correctModal.open}
        onClose={() => setCorrectModal({ open: false, row: null })}
        onSuccess={() => {
          setCorrectModal({ open: false, row: null });
          handleApply();
        }}
        eventId={correctModal.row?.event?._id ?? correctModal.row?.event}
        attendanceId={correctModal.row?._id}
        studentName={correctModal.row?.student?.name}
        currentStatus={correctModal.row?.status}
      />
    </AppShell>
  );
}

export default AttendanceOverviewPage;
