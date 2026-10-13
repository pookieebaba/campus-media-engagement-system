import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarDays, ClipboardList, Bell, ArrowRight } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { listEvents } from '../../api/event.api.js';
import { listNotifications } from '../../api/notification.api.js';
import { formatDate, formatRelativeTime } from '../../utils/formatters.js';

export function FacultyDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supervisedEvents, setSupervisedEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    document.title = 'Dashboard | CMES';
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [eventsRes, notifRes] = await Promise.all([
          listEvents({ limit: 100 }),
          listNotifications({ limit: 5 }),
        ]);
        const allEvents = eventsRes.data?.events ?? eventsRes.data ?? [];
        const filtered = allEvents.filter((ev) =>
          Array.isArray(ev.supervisors) &&
          ev.supervisors.some((s) => (s._id ?? s) === user._id)
        );
        setSupervisedEvents(filtered);
        setNotifications(notifRes.data?.notifications ?? notifRes.data ?? []);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) return <AppShell title="Dashboard"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return (
    <AppShell title="Dashboard">
      <Card className="text-destructive font-body">{error}</Card>
    </AppShell>
  );

  const now = new Date();
  const upcomingEvents = supervisedEvents.filter(
    (ev) => ['published', 'ongoing'].includes(ev.status) && new Date(ev.date) >= now
  );
  const activeEvents = supervisedEvents.filter((ev) =>
    ['published', 'ongoing'].includes(ev.status)
  );

  // Count unique students across all supervised events
  const uniqueStudentIds = new Set();
  supervisedEvents.forEach((ev) => {
    (ev.assignedStudents ?? []).forEach((s) => uniqueStudentIds.add(s._id ?? s));
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const nextThreeEvents = upcomingEvents.slice(0, 3);

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Assigned Students" value={uniqueStudentIds.size} />
          <StatCard icon={CalendarDays} label="Upcoming Events" value={upcomingEvents.length} />
          <StatCard icon={ClipboardList} label="Active Events" value={activeEvents.length} />
          <StatCard icon={Bell} label="Unread Notifications" value={unreadCount} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming events */}
          <Card>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Your Upcoming Events</h2>
            {nextThreeEvents.length === 0 ? (
              <EmptyState title="No upcoming events" description="You have no supervised events coming up." />
            ) : (
              <ul className="flex flex-col gap-3">
                {nextThreeEvents.map((ev) => (
                  <li key={ev._id} className="border border-border rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Link
                        to={`/faculty/events/${ev._id}`}
                        className="font-semibold text-foreground hover:text-moss transition-colors font-body text-sm"
                      >
                        {ev.title}
                      </Link>
                      <EventStatusBadge status={ev.status} />
                    </div>
                    <p className="text-xs text-foreground/60 font-body">{formatDate(ev.date)}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        to={`/faculty/events/${ev._id}/attendance`}
                        className="text-xs text-moss hover:underline font-body font-semibold flex items-center gap-1"
                      >
                        Take Attendance <ArrowRight size={12} />
                      </Link>
                      <Link
                        to={`/faculty/events/${ev._id}/qr`}
                        className="text-xs text-moss hover:underline font-body font-semibold flex items-center gap-1"
                      >
                        QR Code <ArrowRight size={12} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent notifications */}
          <Card>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Recent Notifications</h2>
            {notifications.length === 0 ? (
              <EmptyState title="No notifications" description="You have no recent notifications." />
            ) : (
              <ul className="flex flex-col gap-3">
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    className={[
                      'p-3 rounded-xl border',
                      n.isRead ? 'border-border' : 'border-l-4 border-l-moss bg-stone/50 border-border',
                    ].join(' ')}
                  >
                    <p className="font-semibold text-sm text-foreground font-body">{n.title}</p>
                    <p className="text-xs text-foreground/60 font-body mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-foreground/40 font-body mt-1">{formatRelativeTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default FacultyDashboardPage;
