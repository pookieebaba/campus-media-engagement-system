import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { useToast } from '../ui/Toast.jsx';
import { createUser, listUsers } from '../../api/user.api.js';
import { listBlocks } from '../../api/block.api.js';

export function CreateUserModal({ isOpen, onClose, onSuccess, role }) {
  const toast = useToast();
  const [blocks, setBlocks] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    block: '',
    supervisor: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setForm({ name: '', email: '', password: '', studentId: '', block: '', supervisor: '' });
    setErrors({});
    setShowPassword(false);

    listBlocks()
      .then((res) => setBlocks(res.data?.blocks ?? res.data ?? []))
      .catch(() => {});

    if (role === 'student') {
      listUsers({ role: 'faculty' })
        .then((res) => setFacultyList(res.data?.users ?? res.data ?? []))
        .catch(() => {});
    }
  }, [isOpen, role]);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password.trim()) errs.password = 'Password is required';
    if (role === 'student' && !form.studentId.trim()) errs.studentId = 'Student ID is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = { name: form.name, email: form.email, password: form.password, role };
    if (role === 'student') {
      payload.studentId = form.studentId;
      if (form.block) payload.block = form.block;
      if (form.supervisor) payload.supervisor = form.supervisor;
    } else if (role === 'faculty') {
      if (form.block) payload.block = form.block;
    }

    setLoading(true);
    try {
      await createUser(payload);
      toast.success(`${role === 'student' ? 'Student' : 'Faculty'} created successfully`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add ${role === 'student' ? 'Student' : 'Faculty'}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-body">
        <Input
          label="Full Name"
          required
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="Enter full name"
        />
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          placeholder="Enter email address"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground font-body">
            Password <span className="text-destructive ml-1" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Enter password"
              className={[
                'w-full px-3 py-2 pr-10 text-sm font-body text-foreground bg-background',
                'border rounded-xl transition-colors',
                errors.password ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-moss',
                'focus:outline-none focus:ring-2 focus:ring-offset-1 placeholder:text-foreground/40',
              ].join(' ')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="text-xs text-destructive font-body mt-0.5">{errors.password}</p>
          )}
        </div>

        {role === 'student' && (
          <Input
            label="Student ID"
            required
            value={form.studentId}
            onChange={(e) => handleChange('studentId', e.target.value.toUpperCase())}
            error={errors.studentId}
            placeholder="e.g. ET2024001"
          />
        )}

        <Select
          label="Block"
          value={form.block}
          onChange={(e) => handleChange('block', e.target.value)}
        >
          <option value="">— Select Block —</option>
          {blocks.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </Select>

        {role === 'student' && (
          <Select
            label="Supervisor (Faculty)"
            value={form.supervisor}
            onChange={(e) => handleChange('supervisor', e.target.value)}
          >
            <option value="">— Select Supervisor —</option>
            {facultyList.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </Select>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Create {role === 'student' ? 'Student' : 'Faculty'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateUserModal;
