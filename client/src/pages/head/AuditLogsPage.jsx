import React, { useCallback, useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FilterBar } from '../../components/shared/FilterBar.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { listAuditLogs } from '../../api/auditLog.api.js';
import { formatDateTime } from '../../utils/formatters.js';

const ACTION_OPTIONS = [
  { value: 'user_create', label: 'User Create' },
  { value: 'user_update', label: 'User Update' },
  { value: 'user_deactivate', label: 'User Deactivate' },
  { value: 'event_publish', label: 'Event Publish' },
  { value: 'event_cancel', label: 'Event Cancel' },
  { value: 'attendance_correct', label: 'Attendance Correct' },
  { value: 'block_create', label: 'Block Create' },
  { value: 'bulk_import', label: 'Bulk Import' },
];

export function AuditLogsPage() {
  const toast = useToast();
  const { page, limit, setTotalPages, paginationProps } = usePagination({ initialLimit: 20 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [changesModal, setChangesModal] = useState({ open: false, log: null });

  useEffect(() => {
    document.title = 'Audit Logs | CMES';
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (actionFilter) params.action = actionFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await listAuditLogs(params);
      setLogs(res.data?.logs ?? res.data ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, dateFrom, dateTo, setTotalPages, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (v) => (
        <span className="text-xs font-mono whitespace-nowrap">{formatDateTime(v)}</span>
      ),
    },
    {
      key: 'actor',
      label: 'Actor',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.actor?.name ?? '?'} size="sm" />
          <span className="text-sm font-body">{row.actor?.name ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (v) => (
        <span className="font-mono text-xs bg-stone border border-border px-2 py-1 rounded-full">
          {v}
        </span>
      ),
    },
    {
      key: 'targetType',
      label: 'Target',
      render: (v, row) => (
        <span className="text-sm font-body">
          {v ?? '—'}{row.targetId ? `#${String(row.targetId).slice(-6)}` : ''}
        </span>
      ),
    },
    {
      key: 'changes',
      label: 'Changes',
      render: (v, row) =>
        v ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChangesModal({ open: true, log: row })}
          >
            View
          </Button>
        ) : '—',
    },
  ];

  return (
    <AppShell title="Audit Logs">
      <div className="flex flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <FilterBar
            filters={[
              { name: 'action', label: 'All Actions', options: ACTION_OPTIONS },
            ]}
            values={{ action: actionFilter }}
            onChange={(name, val) => { if (name === 'action') setActionFilter(val); }}
          />
          <Input
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            wrapperClassName="min-w-[140px]"
          />
          <Input
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            wrapperClassName="min-w-[140px]"
          />
        </div>

        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyTitle="No audit logs found"
        />
        <Pagination {...paginationProps} />
      </div>

      {/* Changes Modal */}
      <Modal
        isOpen={changesModal.open}
        onClose={() => setChangesModal({ open: false, log: null })}
        title="Change Details"
        size="lg"
      >
        {changesModal.log && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground/60 mb-1">Before</p>
              <pre className="bg-stone border border-border rounded-xl p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(changesModal.log.changes?.before ?? {}, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/60 mb-1">After</p>
              <pre className="bg-stone border border-border rounded-xl p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(changesModal.log.changes?.after ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

export default AuditLogsPage;
