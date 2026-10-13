import React, { useEffect, useState } from 'react';
import { CheckCheck, Bell } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { listNotifications, markRead, markAllRead } from '../../api/notification.api.js';
import { formatRelativeTime } from '../../utils/formatters.js';
import { usePagination } from '../../hooks/usePagination.js';

export function FacultyNotificationsPage() {
  const toast = useToast();
  const { page, limit, setTotalPages, paginationProps } = usePagination({ initialLimit: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    document.title = 'Notifications | CMES';
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications({ page, limit });
      setNotifications(res.data?.notifications ?? res.data ?? []);
      if (res.data?.totalPages) setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, [page, limit]);

  async function handleMarkRead(id) {
    try {
      await markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark notification as read');
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading) return <AppShell title="Notifications"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="Notifications"><Card className="text-destructive font-body">{error}</Card></AppShell>;

  return (
    <AppShell title="Notifications">
      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-heading text-xl font-semibold text-foreground">Notifications</h1>
          <Button
            variant="secondary"
            icon={CheckCheck}
            loading={markingAll}
            onClick={handleMarkAllRead}
            size="sm"
          >
            Mark All Read
          </Button>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You have no notifications at this time."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={[
                  'p-4 rounded-2xl border',
                  n.isRead
                    ? 'border-border bg-background'
                    : 'border-l-4 border-l-moss bg-stone/50 border-border',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-foreground font-body">{n.title}</p>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(n._id)}
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground/60 font-body mt-1 line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-foreground/40 font-body">
                  {n.sender?.name && <span>{n.sender.name}</span>}
                  <span>&middot;</span>
                  <span>{formatRelativeTime(n.createdAt)}</span>
                  {n.relatedEvent?.title && (
                    <>
                      <span>&middot;</span>
                      <span className="text-moss">{n.relatedEvent.title}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination {...paginationProps} />
      </div>
    </AppShell>
  );
}

export default FacultyNotificationsPage;
