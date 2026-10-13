import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { QRCodeDisplay } from '../../components/shared/QRCodeDisplay.jsx';
import { getEvent, getQRCode } from '../../api/event.api.js';
import { listAttendance } from '../../api/attendance.api.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';

export function QRAttendancePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [qrDataURL, setQrDataURL] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (event) document.title = `QR Code — ${event.title} | CMES`;
  }, [event]);

  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      setError(null);
      try {
        const [eventRes, qrRes] = await Promise.all([
          getEvent(id),
          getQRCode(id),
        ]);
        setEvent(eventRes.data?.event ?? eventRes.data);
        setQrDataURL(qrRes.data?.qrDataURL ?? qrRes.data?.dataURL ?? null);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load QR code');
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, [id]);

  // Poll attendance every 10 seconds
  useEffect(() => {
    function pollCheckins() {
      listAttendance(id)
        .then((res) => {
          const list = res.data?.attendance ?? res.data ?? [];
          const qrOnly = list
            .filter((a) => a.checkInMethod === 'qr')
            .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
          setRecentCheckins(qrOnly);
        })
        .catch(() => {});
    }

    pollCheckins();
    intervalRef.current = setInterval(pollCheckins, 10000);
    return () => clearInterval(intervalRef.current);
  }, [id]);

  async function handleRefreshQR() {
    setQrLoading(true);
    try {
      const res = await getQRCode(id);
      setQrDataURL(res.data?.qrDataURL ?? res.data?.dataURL ?? null);
    } catch {
      // silent
    } finally {
      setQrLoading(false);
    }
  }

  if (loading) return <AppShell title="QR Code"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="QR Code"><Card className="text-destructive font-body">{error}</Card></AppShell>;

  return (
    <AppShell title={event ? `QR Code — ${event.title}` : 'QR Code'}>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        {/* Event info */}
        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground">{event?.title}</h2>
          <p className="text-sm text-foreground/60 font-body mt-1">
            {formatDate(event?.date)} &middot; {event?.venue}
          </p>
        </Card>

        {/* QR Code */}
        <QRCodeDisplay
          dataURL={qrDataURL}
          altText={`QR code for ${event?.title}`}
          eventTitle={event?.title}
        />

        <div className="flex justify-center">
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={qrLoading}
            onClick={handleRefreshQR}
          >
            Refresh QR
          </Button>
        </div>

        {/* Recent check-ins */}
        <Card>
          <h2 className="font-heading font-semibold text-foreground mb-4">Recent QR Check-ins</h2>
          {recentCheckins.length === 0 ? (
            <EmptyState
              title="No QR check-ins yet"
              description="Waiting for students to check in using the QR code."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Student ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Check-in Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCheckins.map((a, i) => (
                    <tr key={a._id ?? i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-semibold">{a.student?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-foreground/60">{a.student?.studentId ?? '—'}</td>
                      <td className="px-3 py-2 text-foreground/60">{formatDateTime(a.checkInTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

export default QRAttendancePage;
