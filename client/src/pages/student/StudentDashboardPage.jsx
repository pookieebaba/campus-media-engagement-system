import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CalendarDays } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { RsvpStatusBadge } from '../../components/shared/RsvpStatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { myParticipation, submitRsvp } from '../../api/participation.api.js';
import { listNotifications } from '../../api/notification.api.js';
import { formatDate, formatRelativeTime, formatStudentId } from '../../utils/formatters.js';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rsvpLoading, setRsvpLoading] = useState({});

  useEffect(() => {
    document.title = 'Dashboard | CMES';
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [participRes, notifRes] = await Promise.all([
          myParticipation({ limit: 100 }),
          listNotifications({ limit: 5 }),
        ]);
        setParticipations(participRes.data?.participations ?? participRes.data ?? []);
        setNotifications(notifRes.data?.notifications ?? notifRes.data ?? []);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleRsvp(eventId, status) {
    setRsvpLoading((prev) => ({ ...prev, [eventId]: true }));
    try {
      await submitRsvp(eventId, status);
      setParticipations((prev) =>
        prev.map((p) =>
          (p.event?._id ?? p.event) === eventId ? { ...p, rsvpStatus: status } : p
        )
      );
    } catch {
      // silent — user can retry
    } finally {
      setRsvpLoading((prev) => ({ ...prev, [eventId]: false }));
    }
  }

  if (loading) return <AppShell title="Dashboard"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="Dashboard"><Card className="text-destructive font-body">{error}</Card></AppShell>;

  const now = new Date();
  const upcomingParticipations = participations.filter(
    (p) =>
      p.event &&
      ['published', 'ongoing'].includes(p.event.status) &&
      new Date(p.event.date) >= now
  );
  const ongoingEvent = participations.find((p) => p.event?.status === 'ongoing');

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* Check-in banner for ongoing event */}
        {ongoingEvent && (
          <Card className="bg-moss/10 border border-moss/30">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-moss" />
                <div>
                  <p className="font-semibold text-foreground font-body">{ongoingEvent.event.title} is happening now!</p>
                  <p className="text-sm text-foreground/60 font-body">{ongoingEvent.event.venue}</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => navigate(`/student/events/${ongoingEvent.event._id}/checkin`)}
              >
                Check In Now
              </Button>
            </div>
          </Card>
        )}

        {/* Student info card */}
        {user && (
          <Card>
            <div className="flex items-center gap-4">
              <Avatar name={user.name} size="lg" />
              <div>
                <p className="font-heading text-xl font-semibold text-foreground">{user.name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.studentId && (
                    <Badge variant="student">{formatStudentId(user.studentId)}</Badge>
                  )}
                  {user.block && (
                    <Badge variant="default">{user.block?.name ?? user.block}</Badge>
                  )}
                </div>
                {user.supervisor && (
                  <p className="text-sm text-foreground/60 font-body mt-1">
                    Supervisor: {user.supervisor?.name ?? user.supervisor}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming events */}
          <Card>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Your Upcoming Events</h2>
            {upcomingParticipations.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events"
                description="You have no upcoming events."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {upcomingParticipations.slice(0, 3).map((p) => {
                  const ev = p.event;
                  const deadlinePassed = ev.rsvpDeadline && new Date(ev.rsvpDeadline) < now;
                  return (
                    <li key={p._id} className="border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <Link
                          to={`/student/events/${ev._id}`}
                          className="font-semibold text-foreground hover:text-moss transition-colors font-body text-sm"
                        >
                          {ev.title}
                        </Link>
                        <EventStatusBadge status={ev.status} />
                      </div>
                      <p className="text-xs text-foreground/60 font-body mb-2">{formatDate(ev.date)} &middot; {ev.venue}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <RsvpStatusBadge status={p.rsvpStatus} />
                        {!deadlinePassed && (
                          <>
                            <Button
                              size="sm"
                              variant={p.rsvpStatus === 'going' ? 'primary' : 'ghost'}
                              loading={rsvpLoading[ev._id]}
                              disabled={p.rsvpStatus === 'going'}
                              onClick={() => handleRsvp(ev._id, 'going')}
                            >
                              Going
                            </Button>
                            <Button
                              size="sm"
                              variant={p.rsvpStatus === 'not_going' ? 'danger' : 'ghost'}
                              loading={rsvpLoading[ev._id]}
                              disabled={p.rsvpStatus === 'not_going'}
                              onClick={() => handleRsvp(ev._id, 'not_going')}
                            >
                              Not Going
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
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

export default StudentDashboardPage;
