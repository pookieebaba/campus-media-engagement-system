import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { updateUser } from '../../api/user.api.js';
import { formatStudentId } from '../../utils/formatters.js';

export function StudentProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    document.title = 'My Profile | CMES';
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwError('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await updateUser(user._id, { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <AppShell title="My Profile">
      <div className="flex flex-col gap-6 max-w-lg">
        {/* Profile card */}
        <Card>
          <div className="flex flex-col items-center gap-4 text-center">
            <Avatar name={user.name} size="lg" />
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">{user.name}</h1>
              <p className="text-sm text-foreground/60 font-body mt-1">{user.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {user.studentId && (
                <Badge variant="student">{formatStudentId(user.studentId)}</Badge>
              )}
              {user.block && (
                <Badge variant="default">{user.block?.name ?? user.block}</Badge>
              )}
            </div>
            {user.supervisor && (
              <p className="text-sm text-foreground/60 font-body">
                Supervisor: {user.supervisor?.name ?? user.supervisor}
              </p>
            )}
          </div>
        </Card>

        {/* Change password */}
        <Card>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
            {/* Current password */}
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-8 text-foreground/40 hover:text-foreground"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* New password */}
            <div className="relative">
              <Input
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-8 text-foreground/40 hover:text-foreground"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                error={pwError}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-8 text-foreground/40 hover:text-foreground"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex justify-end mt-1">
              <Button type="submit" variant="primary" loading={saving}>
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

export default StudentProfilePage;
