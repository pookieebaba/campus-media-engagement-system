import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { FilterBar } from '../../components/shared/FilterBar.jsx';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { listEvents, publishEvent, cancelEvent } from '../../api/event.api.js';
import { formatDate } from '../../utils/formatters.js';

export function HeadEventsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { page, limit, setTotalPages, paginationProps } = usePagination({ initialLimit: 15 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Confirm dialogs state
  const [publishConfirm, setPublishConfirm] = useState({ open: false, id: null });
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listEvents({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        limit,
      });
      const data = res.data?.events ?? res.data ?? [];
      setEvents(Array.isArray(data) ? data : []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page, limit, setTotalPages, toast]);

  useEffect(() => {
    document.title = 'Events | CMES';
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function handlePublish() {
    setActionLoading(true);
    try {
      await publishEvent(publishConfirm.id);
      toast.success('Event published');
      setPublishConfirm({ open: false, id: null });
      fetchEvents();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to publish event');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    setActionLoading(true);
    try {
      await cancelEvent(cancelModal.id, cancelReason.trim());
      toast.success('Event cancelled');
      setCancelModal({ open: false, id: null });
      setCancelReason('');
      fetchEvents();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to cancel event');
    } finally {
      setActionLoading(false);
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (v, row) => (
        <Link
          to={`/head/events/${row._id}`}
          className="font-semibold text-foreground hover:text-moss transition-colors"
        >
          {v}
        </Link>
      ),
    },
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'venue', label: 'Venue' },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <EventStatusBadge status={v} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/head/events/${row._id}`)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/head/events/${row._id}/edit`)}>
            Edit
          </Button>
          {row.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPublishConfirm({ open: true, id: row._id })}
            >
              Publish
            </Button>
          )}
          {row.status !== 'cancelled' && row.status !== 'completed' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setCancelModal({ open: true, id: row._id });
                setCancelReason('');
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Events">
      <div className="flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            onClearSearch={() => setSearch('')}
            searchPlaceholder="Search events…"
            filters={[
              {
                name: 'status',
                label: 'All Statuses',
                options: [
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'ongoing', label: 'Ongoing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ],
              },
            ]}
            values={{ status: statusFilter }}
            onChange={(name, val) => {
              if (name === 'status') setStatusFilter(val);
            }}
          />
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/head/events/new')}
          >
            Create Event
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={events}
          loading={loading}
          emptyTitle="No events found"
          emptyDescription="Create your first event to get started"
        />

        <Pagination {...paginationProps} />
      </div>

      {/* Publish confirmation */}
      <ConfirmDialog
        isOpen={publishConfirm.open}
        onClose={() => setPublishConfirm({ open: false, id: null })}
        onConfirm={handlePublish}
        title="Publish Event?"
        description="Published events are visible to students and faculty. This action cannot be easily undone."
        confirmLabel="Publish"
        loading={actionLoading}
        variant="primary"
      />

      {/* Cancel with reason modal */}
      <Modal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, id: null })}
        title="Cancel Event"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-body text-foreground/70">
            Please provide a reason for cancelling this event.
          </p>
          <Textarea
            label="Cancellation Reason"
            required
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter reason for cancellation…"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setCancelModal({ open: false, id: null })}
              disabled={actionLoading}
            >
              Back
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={actionLoading}>
              Cancel Event
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

export default HeadEventsPage;
