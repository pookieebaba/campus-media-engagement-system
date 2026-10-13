import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { FilterBar } from '../../components/shared/FilterBar.jsx';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog.jsx';
import { CreateUserModal } from '../../components/shared/CreateUserModal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { listUsers, deactivateUser, activateUser } from '../../api/user.api.js';
import { listBlocks } from '../../api/block.api.js';

export function HeadFacultyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { page, limit, setTotalPages, paginationProps } = usePagination({ initialLimit: 20 });
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [studentCountByFaculty, setStudentCountByFaculty] = useState({});
  const [search, setSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [createModal, setCreateModal] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState({ open: false, user: null });
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    document.title = 'Faculty | CMES';
    listBlocks()
      .then((res) => setBlocks(res.data?.blocks ?? res.data ?? []))
      .catch(() => {});
    // Load all students once to aggregate counts
    listUsers({ role: 'student' })
      .then((res) => {
        const students = res.data?.users ?? res.data ?? [];
        const counts = {};
        (Array.isArray(students) ? students : []).forEach((s) => {
          const supId = typeof s.supervisor === 'object' ? s.supervisor?._id?.toString() : s.supervisor?.toString();
          if (supId) counts[supId] = (counts[supId] ?? 0) + 1;
        });
        setStudentCountByFaculty(counts);
      })
      .catch(() => {});
  }, []);

  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role: 'faculty', page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (blockFilter) params.blockId = blockFilter;
      if (statusFilter !== '') params.isActive = statusFilter;
      const res = await listUsers(params);
      const data = res.data?.users ?? res.data ?? [];
      setFaculty(Array.isArray(data) ? data : []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, blockFilter, statusFilter, page, limit, setTotalPages, toast]);

  useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

  async function handleToggle() {
    const user = toggleConfirm.user;
    setToggleLoading(true);
    try {
      if (user.isActive) {
        await deactivateUser(user._id);
        toast.success('Faculty deactivated');
      } else {
        await activateUser(user._id);
        toast.success('Faculty activated');
      }
      setToggleConfirm({ open: false, user: null });
      fetchFaculty();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Operation failed');
    } finally {
      setToggleLoading(false);
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'block', label: 'Block', render: (_, row) => row.block?.code ?? '—' },
    {
      key: 'students',
      label: 'Assigned Students',
      render: (_, row) => studentCountByFaculty[row._id?.toString()] ?? 0,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (v) =>
        v !== false ? (
          <Badge variant="present">Active</Badge>
        ) : (
          <Badge variant="absent">Inactive</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/head/faculty/${row._id}`)}>
            View
          </Button>
          <Button
            variant={row.isActive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => setToggleConfirm({ open: true, user: row })}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Faculty">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            onClearSearch={() => setSearch('')}
            searchPlaceholder="Search faculty…"
            filters={[
              {
                name: 'block',
                label: 'All Blocks',
                options: blocks.map((b) => ({ value: b._id, label: b.name })),
              },
              {
                name: 'status',
                label: 'All Status',
                options: [
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ],
              },
            ]}
            values={{ block: blockFilter, status: statusFilter }}
            onChange={(name, val) => {
              if (name === 'block') setBlockFilter(val);
              if (name === 'status') setStatusFilter(val);
            }}
          />
          <Button variant="primary" icon={Plus} onClick={() => setCreateModal(true)}>
            Add Faculty
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={faculty}
          loading={loading}
          emptyTitle="No faculty found"
        />
        <Pagination {...paginationProps} />
      </div>

      <CreateUserModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        onSuccess={() => { setCreateModal(false); fetchFaculty(); }}
        role="faculty"
      />

      <ConfirmDialog
        isOpen={toggleConfirm.open}
        onClose={() => setToggleConfirm({ open: false, user: null })}
        onConfirm={handleToggle}
        title={toggleConfirm.user?.isActive ? 'Deactivate Faculty?' : 'Activate Faculty?'}
        description={`Are you sure you want to ${toggleConfirm.user?.isActive ? 'deactivate' : 'activate'} ${toggleConfirm.user?.name}?`}
        confirmLabel={toggleConfirm.user?.isActive ? 'Deactivate' : 'Activate'}
        loading={toggleLoading}
        variant={toggleConfirm.user?.isActive ? 'danger' : 'primary'}
      />
    </AppShell>
  );
}

export default HeadFacultyPage;
