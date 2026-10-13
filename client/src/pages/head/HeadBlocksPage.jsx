import React, { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { listBlocks, createBlock, updateBlock, deleteBlock } from '../../api/block.api.js';
import { listUsers } from '../../api/user.api.js';

const emptyForm = { name: '', code: '', description: '' };

export function HeadBlocksPage() {
  const toast = useToast();
  const [blocks, setBlocks] = useState([]);
  const [studentCountByBlock, setStudentCountByBlock] = useState({});
  const [facultyCountByBlock, setFacultyCountByBlock] = useState({});
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deactivateConfirm, setDeactivateConfirm] = useState({ open: false, block: null });
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const [blocksRes, studentsRes, facultyRes] = await Promise.all([
        listBlocks(),
        listUsers({ role: 'student' }),
        listUsers({ role: 'faculty' }),
      ]);
      const bs = blocksRes.data?.blocks ?? blocksRes.data ?? [];
      const sts = studentsRes.data?.users ?? studentsRes.data ?? [];
      const fac = facultyRes.data?.users ?? facultyRes.data ?? [];

      // Count per block
      const scb = {};
      const fcb = {};
      sts.forEach((u) => {
        const bid = typeof u.block === 'object' ? u.block?._id?.toString() : u.block?.toString();
        if (bid) scb[bid] = (scb[bid] ?? 0) + 1;
      });
      fac.forEach((u) => {
        const bid = typeof u.block === 'object' ? u.block?._id?.toString() : u.block?.toString();
        if (bid) fcb[bid] = (fcb[bid] ?? 0) + 1;
      });

      setBlocks(Array.isArray(bs) ? bs : []);
      setStudentCountByBlock(scb);
      setFacultyCountByBlock(fcb);
    } catch {
      toast.error('Failed to load blocks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Blocks | CMES';
    fetchAll();
  }, []);

  function openAddModal() {
    setEditingBlock(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  }

  function openEditModal(block) {
    setEditingBlock(block);
    setForm({ name: block.name ?? '', code: block.code ?? '', description: block.description ?? '' });
    setFormErrors({});
    setModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.code.trim()) errs.code = 'Code is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingBlock) {
        await updateBlock(editingBlock._id, form);
        toast.success('Block updated');
      } else {
        await createBlock(form);
        toast.success('Block created');
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save block');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    setDeactivateLoading(true);
    try {
      const b = deactivateConfirm.block;
      if (b.isActive === false) {
        await updateBlock(b._id, { isActive: true });
        toast.success('Block reactivated');
      } else {
        await deleteBlock(b._id);
        toast.success('Block deactivated');
      }
      setDeactivateConfirm({ open: false, block: null });
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Operation failed');
    } finally {
      setDeactivateLoading(false);
    }
  }

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    {
      key: 'students',
      label: 'Students',
      render: (_, row) => studentCountByBlock[row._id?.toString()] ?? 0,
    },
    {
      key: 'faculty',
      label: 'Faculty',
      render: (_, row) => facultyCountByBlock[row._id?.toString()] ?? 0,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (v) =>
        v !== false ? (
          <Badge variant="present">Active</Badge>
        ) : (
          <Badge variant="default">Inactive</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button
            variant={row.isActive === false ? 'primary' : 'danger'}
            size="sm"
            onClick={() => setDeactivateConfirm({ open: true, block: row })}
          >
            {row.isActive === false ? 'Reactivate' : 'Deactivate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Blocks">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button variant="primary" icon={Plus} onClick={openAddModal}>
            Add Block
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={blocks}
          loading={loading}
          emptyTitle="No blocks found"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBlock ? 'Edit Block' : 'Add Block'}
        size="md"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Block Name"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g. Engineering Technology"
          />
          <Input
            label="Code"
            required
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            error={formErrors.code}
            placeholder="e.g. ET"
          />
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Optional description"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingBlock ? 'Save Changes' : 'Create Block'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Reactivate confirm */}
      <ConfirmDialog
        isOpen={deactivateConfirm.open}
        onClose={() => setDeactivateConfirm({ open: false, block: null })}
        onConfirm={handleDeactivate}
        title={deactivateConfirm.block?.isActive === false ? 'Reactivate Block?' : 'Deactivate Block?'}
        description={
          deactivateConfirm.block?.isActive === false
            ? 'This will reactivate the block and make it available again.'
            : 'This will deactivate the block. Students and faculty assigned to it will remain.'
        }
        confirmLabel={deactivateConfirm.block?.isActive === false ? 'Reactivate' : 'Deactivate'}
        loading={deactivateLoading}
        variant={deactivateConfirm.block?.isActive === false ? 'primary' : 'danger'}
      />
    </AppShell>
  );
}

export default HeadBlocksPage;
