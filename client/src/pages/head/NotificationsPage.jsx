import React, { useCallback, useEffect, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { listNotifications, markRead, markAllRead } from '../../api/notification.api.js';
import { formatRelativeTime } from '../../utils/formatters.js';

export function NotificationsPage() {
  const toast = useToast();
  const { page, limit, setTotalPages, paginationProps } = usePagination({ initialLimit: 15 });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    document.title = 'Notifications | CMES';
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications({ page, limit });
      setNotifications(res.data?.notifications ?? res.data ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, setTotalPages, toast]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function handleMarkRead(id) {
    try {
      await markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllRead();
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <AppShell title="Notifications">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
            loading={markingAll}
          >
            Mark All Read
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={[
                  'rounded-2xl border p-4 font-body transition-colors',
                  n.isRead
                    ? 'border-border bg-background'
                    : 'border-l-4 border-moss bg-stone/50',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-sm text-foreground/60 line-clamp-2 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-foreground/40">
                      {n.sender?.name && <span>{n.sender.name}</span>}
                      <span>&bull;</span>
                      <span>{formatRelativeTime(n.createdAt)}</span>
                      {n.relatedEvent?.title && (
                        <>
                          <span>&bull;</span>
                          <span>{n.relatedEvent.title}</span>
                        </>
                      )}
                    </div>
                  </div>
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
              </div>
            ))}
          </div>
        )}

        <Pagination {...paginationProps} />
      </div>
    </AppShell>
  );
}

export default NotificationsPage;
