import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, XCircle, CheckCircle } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { getEvent } from '../../api/event.api.js';
import { qrCheckin } from '../../api/attendance.api.js';
import { formatDateTime } from '../../utils/formatters.js';

export function QRCheckInPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'already' | 'invalid' | null

  useEffect(() => {
    document.title = 'Check In | CMES';
  }, []);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      setError(null);
      try {
        const res = await getEvent(id);
        setEvent(res.data?.event ?? res.data);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token.trim()) return;

    setSubmitting(true);
    setResult(null);
    try {
      await qrCheckin({ qrToken: token.trim(), eventId: id });
      setResult('success');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setResult('already');
      } else if (status === 403 || status === 400) {
        setResult('invalid');
      } else {
        setResult('invalid');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <AppShell title="Check In"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="Check In"><Card className="text-destructive font-body">{error}</Card></AppShell>;

  const now = new Date();
  const windowStart = event?.checkInWindow?.start ? new Date(event.checkInWindow.start) : null;
  const windowEnd = event?.checkInWindow?.end ? new Date(event.checkInWindow.end) : null;

  let windowState = 'open';
  if (!['ongoing', 'published'].includes(event?.status)) {
    windowState = 'inactive';
  } else if (windowStart && now < windowStart) {
    windowState = 'not_open';
  } else if (windowEnd && now > windowEnd) {
    windowState = 'closed';
  }

  return (
    <AppShell title="Check In">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Event info */}
        <Card>
          <h1 className="font-heading text-xl font-semibold text-foreground">{event?.title}</h1>
          <p className="text-sm text-foreground/60 font-body mt-1">{event?.venue}</p>
        </Card>

        {/* Window state: inactive */}
        {windowState === 'inactive' && (
          <Card className="text-center">
            <XCircle size={40} className="text-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-foreground font-body">Event is not active</p>
            <p className="text-sm text-foreground/60 font-body mt-1">
              Check-in is only available for ongoing or published events.
            </p>
          </Card>
        )}

        {/* Window state: not open yet */}
        {windowState === 'not_open' && (
          <Card className="text-center">
            <Clock size={40} className="text-foreground/60 mx-auto mb-3" />
            <p className="font-semibold text-foreground font-body">Check-in is not yet open</p>
            <p className="text-sm text-foreground/60 font-body mt-1">
              Check-in opens at {formatDateTime(windowStart)}
            </p>
          </Card>
        )}

        {/* Window state: closed */}
        {windowState === 'closed' && (
          <Card className="text-center">
            <XCircle size={40} className="text-destructive mx-auto mb-3" />
            <p className="font-semibold text-foreground font-body">Check-in window has closed</p>
            <p className="text-sm text-foreground/60 font-body mt-1">
              The check-in window ended at {formatDateTime(windowEnd)}.
            </p>
          </Card>
        )}

        {/* Window state: open — show form */}
        {windowState === 'open' && (
          <>
            {result === 'success' && (
              <Card className="text-center bg-moss/5 border border-moss/20">
                <CheckCircle size={40} className="text-moss mx-auto mb-3" />
                <p className="font-semibold text-moss font-body text-lg">Checked in successfully!</p>
                <p className="text-sm text-foreground/60 font-body mt-1">
                  Checked in at {formatDateTime(new Date())}
                </p>
              </Card>
            )}

            {result === 'already' && (
              <Card className="border border-terracotta/20 bg-terracotta/5">
                <p className="font-semibold text-terracotta font-body">Already checked in</p>
                <p className="text-sm text-foreground/60 font-body mt-1">
                  You have already checked in to this event.
                </p>
              </Card>
            )}

            {result === 'invalid' && (
              <Card className="border border-destructive/20 bg-destructive/5">
                <p className="font-semibold text-destructive font-body">Invalid or expired token</p>
                <p className="text-sm text-foreground/60 font-body mt-1">
                  Please ask your faculty supervisor for the current token.
                </p>
              </Card>
            )}

            {result !== 'success' && (
              <Card>
                <h2 className="font-heading font-semibold text-foreground mb-2">Enter Check-in Token</h2>
                <p className="text-sm text-foreground/60 font-body mb-4">
                  Enter the token displayed by your faculty supervisor.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <Input
                    label="QR Token"
                    placeholder="Paste or type the QR token here"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submitting}
                    disabled={!token.trim()}
                  >
                    Check In
                  </Button>
                </form>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default QRCheckInPage;
