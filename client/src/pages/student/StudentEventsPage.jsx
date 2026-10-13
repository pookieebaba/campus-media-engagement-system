import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { FilterBar } from '../../components/shared/FilterBar.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { BlockBadge } from '../../components/shared/BlockBadge.jsx';
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

export function StudentEventsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    document.title = 'My Events | CMES';
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const res = await listEvents({ limit: 100 });
        const allEvents = res.data?.events ?? res.data ?? [];
        // Filter to events where student is in assignedStudents
        const myEvents = user
          ? allEvents.filter((ev) =>
              Array.isArray(ev.assignedStudents) &&
              ev.assignedStudents.some((s) => (s._id ?? s) === user._id)
            )
          : allEvents;
        setEvents(myEvents);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [user]);

  const filtered = events.filter((ev) => {
    if (filters.status && ev.status !== filters.status) return false;
    if (filters.search && !ev.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <AppShell title="My Events"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="My Events"><Card className="text-destructive font-body">{error}</Card></AppShell>;

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

        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events found"
            description="You have not been assigned to any events yet."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ev) => (
              <Link
                key={ev._id}
                to={`/student/events/${ev._id}`}
                className="block hover:opacity-90 transition-opacity"
              >
                <Card className="h-full flex flex-col gap-3 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground font-body text-sm leading-snug flex-1">{ev.title}</h3>
                    <EventStatusBadge status={ev.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/60 font-body">
                    <CalendarDays size={13} />
                    <span>{formatDate(ev.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/60 font-body">
                    <MapPin size={13} />
                    <span>{ev.venue}</span>
                  </div>
                  {(ev.participatingBlocks ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {ev.participatingBlocks.slice(0, 3).map((b, i) => (
                        <BlockBadge key={b._id ?? i} block={b} />
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default StudentEventsPage;
