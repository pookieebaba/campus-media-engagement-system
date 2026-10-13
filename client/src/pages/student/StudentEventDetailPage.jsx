import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { RsvpStatusBadge } from '../../components/shared/RsvpStatusBadge.jsx';
import { BlockBadge } from '../../components/shared/BlockBadge.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { getEvent } from '../../api/event.api.js';
import { myParticipation, submitRsvp } from '../../api/participation.api.js';
import { formatDate } from '../../utils/formatters.js';

export function StudentEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [myRsvp, setMyRsvp] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [eventRes, participRes] = await Promise.all([
          getEvent(id),
          myParticipation({ limit: 100 }),
        ]);
        const ev = eventRes.data?.event ?? eventRes.data;
        setEvent(ev);

        const all = participRes.data?.participations ?? participRes.data ?? [];
        const record = all.find((p) => (p.event?._id ?? p.event) === id);
        setMyRsvp(record ?? null);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (event) document.title = `${event.title} | CMES`;
  }, [event]);

  async function handleRsvp(status) {
    setRsvpLoading(true);
    try {
      await submitRsvp(id, status);
      setMyRsvp((prev) => ({ ...prev, rsvpStatus: status }));
      toast.success(`RSVP updated to "${status === 'going' ? 'Going' : 'Not Going'}"`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update RSVP');
    } finally {
      setRsvpLoading(false);
    }
  }

  if (loading) return <AppShell title="Event"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="Event"><Card className="text-destructive font-body">{error}</Card></AppShell>;
  if (!event) return <AppShell title="Event"><EmptyState title="Event not found" /></AppShell>;

  const now = new Date();
  const deadlinePassed = event.rsvpDeadline && new Date(event.rsvpDeadline) < now;

  return (
    <AppShell title={event.title}>
      <div className="flex flex-col gap-4 max-w-2xl">
        {/* Event header */}
        <Card>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="font-heading text-xl font-semibold text-foreground flex-1">{event.title}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-sm text-foreground/60 font-body mb-1">
            {event.venue} &middot; {formatDate(event.date)} &middot; {event.startTime}–{event.endTime}
          </p>
          {event.description && (
            <p className="text-sm text-foreground/80 font-body mt-3">{event.description}</p>
          )}
          {(event.supervisors ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-foreground/60 font-body uppercase tracking-wider mb-2">Supervisors</p>
              <div className="flex flex-wrap gap-2">
                {event.supervisors.map((s, i) => (
                  <div key={s._id ?? i} className="flex items-center gap-1.5">
                    <Avatar name={s.name ?? 'S'} size="sm" />
                    <span className="text-sm font-body">{s.name ?? s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(event.participatingBlocks ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {event.participatingBlocks.map((b, i) => (
                <BlockBadge key={b._id ?? i} block={b} />
              ))}
            </div>
          )}
        </Card>

        {/* RSVP card */}
        <Card>
          <h2 className="font-heading font-semibold text-foreground mb-3">Your RSVP</h2>
          <div className="flex items-center gap-3 mb-3">
            <RsvpStatusBadge status={myRsvp?.rsvpStatus ?? 'pending'} />
            {!myRsvp && <span className="text-sm text-foreground/60 font-body">Not RSVPed yet</span>}
          </div>
          {deadlinePassed ? (
            <p className="text-sm text-foreground/60 font-body">
              RSVP deadline has passed ({formatDate(event.rsvpDeadline)})
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={myRsvp?.rsvpStatus === 'going' ? 'primary' : 'secondary'}
                size="sm"
                loading={rsvpLoading}
                disabled={myRsvp?.rsvpStatus === 'going'}
                onClick={() => handleRsvp('going')}
              >
                Going
              </Button>
              <Button
                variant={myRsvp?.rsvpStatus === 'not_going' ? 'danger' : 'secondary'}
                size="sm"
                loading={rsvpLoading}
                disabled={myRsvp?.rsvpStatus === 'not_going'}
                onClick={() => handleRsvp('not_going')}
              >
                Not Going
              </Button>
            </div>
          )}
        </Card>

        {/* Check-in card */}
        {event.status === 'ongoing' && (
          <Card className="bg-moss/5 border border-moss/20">
            <h2 className="font-heading font-semibold text-foreground mb-2">Check In</h2>
            {myRsvp?.attendanceStatus === 'present' ? (
              <p className="text-moss font-body font-semibold text-sm">✓ You are checked in</p>
            ) : (
              <>
                <p className="text-sm text-foreground/60 font-body mb-3">
                  This event is ongoing. Check in using the QR token from your faculty supervisor.
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/student/events/${id}/checkin`)}
                >
                  Check In Now
                </Button>
              </>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default StudentEventDetailPage;
