import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { AttendanceStatusBadge } from '../../components/shared/AttendanceStatusBadge.jsx';
import { RsvpStatusBadge } from '../../components/shared/RsvpStatusBadge.jsx';
import { ExportButton } from '../../components/shared/ExportButton.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { listEvents } from '../../api/event.api.js';
import { listBlocks } from '../../api/block.api.js';
import {
  attendanceReport,
  participationReport,
  exportAttendanceCSV,
  exportParticipationCSV,
} from '../../api/report.api.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';

const TABS = ['Attendance', 'Participation'];

export function ReportsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Attendance');
  const [events, setEvents] = useState([]);
  const [blocks, setBlocks] = useState([]);

  // Attendance state
  const [attFilters, setAttFilters] = useState({ eventId: '', blockId: '', dateFrom: '', dateTo: '', status: '' });
  const [attRecords, setAttRecords] = useState(null);
  const [attLoading, setAttLoading] = useState(false);

  // Participation state
  const [partFilters, setPartFilters] = useState({ eventId: '', blockId: '', dateFrom: '', dateTo: '' });
  const [partRecords, setPartRecords] = useState(null);
  const [partLoading, setPartLoading] = useState(false);

  useEffect(() => {
    document.title = 'Reports | CMES';
    Promise.all([listEvents({ limit: 100 }), listBlocks()])
      .then(([evRes, blRes]) => {
        setEvents(evRes.data?.events ?? evRes.data ?? []);
        setBlocks(blRes.data?.blocks ?? blRes.data ?? []);
      })
      .catch(() => {});
  }, []);

  async function generateAttendance() {
    setAttLoading(true);
    try {
      const params = {};
      if (attFilters.eventId) params.eventId = attFilters.eventId;
      if (attFilters.blockId) params.blockId = attFilters.blockId;
      if (attFilters.dateFrom) params.dateFrom = attFilters.dateFrom;
      if (attFilters.dateTo) params.dateTo = attFilters.dateTo;
      if (attFilters.status) params.status = attFilters.status;
      const res = await attendanceReport(params);
      setAttRecords(res.data?.data ?? res.data ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to generate report');
    } finally {
      setAttLoading(false);
    }
  }

  async function generateParticipation() {
    setPartLoading(true);
    try {
      const params = {};
      if (partFilters.eventId) params.eventId = partFilters.eventId;
      if (partFilters.blockId) params.blockId = partFilters.blockId;
      if (partFilters.dateFrom) params.dateFrom = partFilters.dateFrom;
      if (partFilters.dateTo) params.dateTo = partFilters.dateTo;
      const res = await participationReport(params);
      setPartRecords(res.data?.data ?? res.data ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to generate report');
    } finally {
      setPartLoading(false);
    }
  }

  const attColumns = [
    { key: 'studentId', label: 'Student ID', render: (_, row) => row.student?.studentId ?? '—' },
    { key: 'name', label: 'Name', render: (_, row) => row.student?.name ?? '—' },
    { key: 'event', label: 'Event', render: (v) => v?.title ?? v ?? '—' },
    { key: 'date', label: 'Date', render: (_, row) => formatDate(row.event?.date) },
    { key: 'status', label: 'Status', render: (v) => <AttendanceStatusBadge status={v} /> },
    { key: 'checkInMethod', label: 'Method', render: (v) => v ?? '—' },
  ];

  const partColumns = [
    { key: 'studentId', label: 'Student ID', render: (_, row) => row.student?.studentId ?? '—' },
    { key: 'name', label: 'Name', render: (_, row) => row.student?.name ?? '—' },
    { key: 'event', label: 'Event', render: (v) => v?.title ?? v ?? '—' },
    { key: 'date', label: 'Date', render: (_, row) => formatDate(row.event?.date) },
    { key: 'rsvpStatus', label: 'RSVP', render: (v) => <RsvpStatusBadge status={v} /> },
    { key: 'attendanceStatus', label: 'Attendance', render: (v) => v ? <AttendanceStatusBadge status={v} /> : '—' },
  ];

  function setAttFilter(key, val) { setAttFilters((p) => ({ ...p, [key]: val })); }
  function setPartFilter(key, val) { setPartFilters((p) => ({ ...p, [key]: val })); }

  return (
    <AppShell title="Reports">
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2 text-sm font-body font-semibold transition-colors rounded-t-xl',
                activeTab === tab
                  ? 'text-moss border-b-2 border-moss -mb-px'
                  : 'text-foreground/60 hover:text-foreground',
              ].join(' ')}
            >
              {tab} Report
            </button>
          ))}
        </div>

        {activeTab === 'Attendance' && (
          <div className="flex flex-col gap-4">
            <Card>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Attendance Filters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Select label="Event" value={attFilters.eventId} onChange={(e) => setAttFilter('eventId', e.target.value)}>
                  <option value="">All Events</option>
                  {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                </Select>
                <Select label="Block" value={attFilters.blockId} onChange={(e) => setAttFilter('blockId', e.target.value)}>
                  <option value="">All Blocks</option>
                  {blocks.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
                <Input label="Date From" type="date" value={attFilters.dateFrom} onChange={(e) => setAttFilter('dateFrom', e.target.value)} />
                <Input label="Date To" type="date" value={attFilters.dateTo} onChange={(e) => setAttFilter('dateTo', e.target.value)} />
                <Select label="Status" value={attFilters.status} onChange={(e) => setAttFilter('status', e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </Select>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button variant="primary" onClick={generateAttendance} loading={attLoading}>
                  Generate Report
                </Button>
                {attRecords !== null && (
                  <ExportButton
                    onExport={() => exportAttendanceCSV({
                      eventId: attFilters.eventId || undefined,
                      blockId: attFilters.blockId || undefined,
                      dateFrom: attFilters.dateFrom || undefined,
                      dateTo: attFilters.dateTo || undefined,
                      status: attFilters.status || undefined,
                    }).then((r) => r.data)}
                    filename="attendance-report.csv"
                  >
                    Export CSV
                  </ExportButton>
                )}
              </div>
            </Card>

            {attLoading ? (
              <LoadingSpinner />
            ) : attRecords === null ? (
              <EmptyState title="No report generated" description="Apply filters and click Generate Report" />
            ) : (
              <DataTable columns={attColumns} data={Array.isArray(attRecords) ? attRecords : []} emptyTitle="No records found" />
            )}
          </div>
        )}

        {activeTab === 'Participation' && (
          <div className="flex flex-col gap-4">
            <Card>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Participation Filters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="Event" value={partFilters.eventId} onChange={(e) => setPartFilter('eventId', e.target.value)}>
                  <option value="">All Events</option>
                  {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                </Select>
                <Select label="Block" value={partFilters.blockId} onChange={(e) => setPartFilter('blockId', e.target.value)}>
                  <option value="">All Blocks</option>
                  {blocks.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </Select>
                <Input label="Date From" type="date" value={partFilters.dateFrom} onChange={(e) => setPartFilter('dateFrom', e.target.value)} />
                <Input label="Date To" type="date" value={partFilters.dateTo} onChange={(e) => setPartFilter('dateTo', e.target.value)} />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button variant="primary" onClick={generateParticipation} loading={partLoading}>
                  Generate Report
                </Button>
                {partRecords !== null && (
                  <ExportButton
                    onExport={() => exportParticipationCSV({
                      eventId: partFilters.eventId || undefined,
                      blockId: partFilters.blockId || undefined,
                      dateFrom: partFilters.dateFrom || undefined,
                      dateTo: partFilters.dateTo || undefined,
                    }).then((r) => r.data)}
                    filename="participation-report.csv"
                  >
                    Export CSV
                  </ExportButton>
                )}
              </div>
            </Card>

            {partLoading ? (
              <LoadingSpinner />
            ) : partRecords === null ? (
              <EmptyState title="No report generated" description="Apply filters and click Generate Report" />
            ) : (
              <DataTable columns={partColumns} data={Array.isArray(partRecords) ? partRecords : []} emptyTitle="No records found" />
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ReportsPage;
