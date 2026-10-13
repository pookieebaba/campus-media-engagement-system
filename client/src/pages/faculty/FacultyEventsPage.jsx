import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, QrCode } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { FilterBar } from '../../components/shared/FilterBar.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { listEvents } from '../../api/event.api.js';
import { formatDate } from '../../utils/formatters.js';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function FacultyEventsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    document.title = 'My Events | CMES';
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const res = await listEvents({ limit: 100 });
        const events = res.data?.events ?? res.data ?? [];
        const supervised = events.filter((ev) =>
          Array.isArray(ev.supervisors) &&
          ev.supervisors.some((s) => (s._id ?? s) === user._id)
        );
        setAllEvents(supervised);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [user]);

  const filteredEvents = allEvents.filter((ev) => {
    if (filters.status && ev.status !== filters.status) return false;
    if (filters.search && !ev.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (_, row) => (
        <Link to={`/faculty/events/${row._id}`} className="font-semibold text-foreground hover:text-moss transition-colors">
          {row.title}
        </Link>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <EventStatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const disabled = row.status === 'draft' || row.status === 'cancelled';
        return (
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" as={Link} to={`/faculty/events/${row._id}`}
              onClick={() => {}}>
              View
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={ClipboardList}
              disabled={disabled}
              onClick={() => window.location.href = `/faculty/events/${row._id}/attendance`}
            >
              Attendance
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={QrCode}
              disabled={disabled}
              onClick={() => window.location.href = `/faculty/events/${row._id}/qr`}
            >
              QR
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) return <AppShell title="My Events"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return (
    <AppShell title="My Events">
      <Card className="text-destructive font-body">{error}</Card>
    </AppShell>
  );

  return (
    <AppShell title="My Events">
      <div className="flex flex-col gap-4">
        <FilterBar
          filters={[{ name: 'status', label: 'All Statuses', options: STATUS_OPTIONS }]}
          values={filters}
          onChange={(name, val) => setFilters((f) => ({ ...f, [name]: val }))}
          searchValue={filters.search}
          onSearchChange={(val) => setFilters((f) => ({ ...f, search: val }))}
          searchPlaceholder="Search events…"
        />

        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No events found"
            description="You are not assigned as a supervisor for any events matching these filters."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredEvents}
            emptyTitle="No events found"
          />
        )}
      </div>
    </AppShell>
  );
}

export default FacultyEventsPage;
