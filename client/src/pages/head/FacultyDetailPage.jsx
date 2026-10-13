import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { BlockBadge } from '../../components/shared/BlockBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { getUser, listUsers } from '../../api/user.api.js';
import { listEvents } from '../../api/event.api.js';
import { formatDate, formatStudentId } from '../../utils/formatters.js';

export function FacultyDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    getUser(id)
      .then((res) => {
        const u = res.data?.user ?? res.data;
        setUser(u);
        document.title = `${u.name} | CMES`;
        setDataLoading(true);
        return Promise.all([
          listUsers({ role: 'student', supervisor: id }),
          listEvents({ supervisor: id, limit: 20 }),
        ]);
      })
      .then(([studentsRes, eventsRes]) => {
        setStudents(studentsRes.data?.users ?? studentsRes.data ?? []);
        setEvents(eventsRes.data?.events ?? eventsRes.data ?? []);
      })
      .catch(() => toast.error('Failed to load faculty details'))
      .finally(() => {
        setLoading(false);
        setDataLoading(false);
      });
  }, [id, toast]);

  const studentColumns = [
    {
      key: 'studentId',
      label: 'Student ID',
      render: (v) => <span className="font-mono text-xs">{formatStudentId(v)}</span>,
    },
    { key: 'name', label: 'Name' },
    { key: 'block', label: 'Block', render: (_, row) => <BlockBadge block={row.block} /> },
    {
      key: 'isActive',
      label: 'Status',
      render: (v) => (
        <Badge variant={v !== false ? 'present' : 'absent'}>
          {v !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const eventColumns = [
    {
      key: 'title',
      label: 'Title',
      render: (v, row) => (
        <Link to={`/head/events/${row._id}`} className="text-moss hover:underline font-semibold">
          {v}
        </Link>
      ),
    },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'status', label: 'Status', render: (v) => <EventStatusBadge status={v} /> },
  ];

  if (loading) return <AppShell title="Faculty Detail"><LoadingSpinner /></AppShell>;
  if (!user) return (
    <AppShell title="Faculty Detail">
      <Card><p className="font-body text-foreground/60">Faculty not found.</p></Card>
    </AppShell>
  );

  return (
    <AppShell title="Faculty Detail">
      <div className="flex flex-col gap-6">
        {/* Profile Card */}
        <Card>
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar name={user.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-xl font-semibold text-foreground">{user.name}</h1>
              <p className="font-body text-sm text-foreground/60">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.block && <BlockBadge block={user.block} />}
                <Badge variant={user.isActive !== false ? 'present' : 'absent'}>
                  {user.isActive !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Assigned Students */}
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Assigned Students</h2>
          <DataTable
            columns={studentColumns}
            data={Array.isArray(students) ? students : []}
            loading={dataLoading}
            emptyTitle="No students assigned"
          />
        </div>

        {/* Supervised Events */}
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Supervised Events</h2>
          <DataTable
            columns={eventColumns}
            data={Array.isArray(events) ? events : []}
            loading={dataLoading}
            emptyTitle="No supervised events"
          />
        </div>
      </div>
    </AppShell>
  );
}

export default FacultyDetailPage;
