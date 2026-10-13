import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { AttendanceStatusBadge } from '../../components/shared/AttendanceStatusBadge.jsx';
import { BlockBadge } from '../../components/shared/BlockBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { getUser } from '../../api/user.api.js';
import { listEvents } from '../../api/event.api.js';
import { attendanceReport } from '../../api/report.api.js';
import { formatDate, formatStudentId, formatDateTime } from '../../utils/formatters.js';

const TABS = ['Participation', 'Attendance'];

export function StudentDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Participation');

  const [events, setEvents] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [attendance, setAttendance] = useState([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    getUser(id)
      .then((res) => {
        const u = res.data?.user ?? res.data;
        setUser(u);
        document.title = `${u.name} | CMES`;
      })
      .catch(() => toast.error('Failed to load student'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  useEffect(() => {
    if (activeTab === 'Participation' && !eventsLoaded) {
      setEventsLoading(true);
      listEvents({ assignedStudent: id, limit: 50 })
        .then((res) => {
          setEvents(res.data?.events ?? res.data ?? []);
          setEventsLoaded(true);
        })
        .catch(() => toast.error('Failed to load events'))
        .finally(() => setEventsLoading(false));
    }
    if (activeTab === 'Attendance' && !attendanceLoaded) {
      setAttendanceLoading(true);
      attendanceReport({ student: id })
        .then((res) => {
          setAttendance(res.data?.data ?? res.data ?? []);
          setAttendanceLoaded(true);
        })
        .catch(() => {
          setAttendance([]);
          setAttendanceLoaded(true);
        })
        .finally(() => setAttendanceLoading(false));
    }
  }, [activeTab, id, eventsLoaded, attendanceLoaded, toast]);

  const eventColumns = [
    {
      key: 'title',
      label: 'Event',
      render: (v, row) => (
        <Link to={`/head/events/${row._id}`} className="text-moss hover:underline font-semibold">
          {v}
        </Link>
      ),
    },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'status', label: 'Status', render: (v) => <EventStatusBadge status={v} /> },
  ];

  const attendanceColumns = [
    {
      key: 'event',
      label: 'Event',
      render: (v, row) => (
        <Link to={`/head/events/${v?._id ?? row.event}`} className="text-moss hover:underline font-semibold">
          {v?.title ?? v ?? '—'}
        </Link>
      ),
    },
    { key: 'date', label: 'Date', render: (_, row) => formatDate(row.event?.date) },
    { key: 'status', label: 'Status', render: (v) => <AttendanceStatusBadge status={v} /> },
    { key: 'checkInMethod', label: 'Method', render: (v) => v ?? '—' },
    { key: 'checkInTime', label: 'Check-in Time', render: (v) => formatDateTime(v) },
  ];

  if (loading) return <AppShell title="Student Detail"><LoadingSpinner /></AppShell>;
  if (!user) return <AppShell title="Student Detail"><Card><p className="font-body text-foreground/60">Student not found.</p></Card></AppShell>;

  return (
    <AppShell title="Student Detail">
      <div className="flex flex-col gap-6">
        {/* Profile Card */}
        <Card>
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar name={user.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-xl font-semibold text-foreground">{user.name}</h1>
              <p className="font-body text-sm text-foreground/60">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.studentId && (
                  <Badge variant="default">{formatStudentId(user.studentId)}</Badge>
                )}
                {user.block && <BlockBadge block={user.block} />}
                {user.supervisor && (
                  <span className="text-xs font-body text-foreground/60">
                    Supervisor: {user.supervisor?.name ?? user.supervisor}
                  </span>
                )}
                <Badge variant={user.isActive !== false ? 'present' : 'absent'}>
                  {user.isActive !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

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
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Participation' && (
          <DataTable
            columns={eventColumns}
            data={Array.isArray(events) ? events : []}
            loading={eventsLoading}
            emptyTitle="No events assigned"
          />
        )}

        {activeTab === 'Attendance' && (
          <DataTable
            columns={attendanceColumns}
            data={Array.isArray(attendance) ? attendance : []}
            loading={attendanceLoading}
            emptyTitle="No attendance records"
          />
        )}
      </div>
    </AppShell>
  );
}

export default StudentDetailPage;
