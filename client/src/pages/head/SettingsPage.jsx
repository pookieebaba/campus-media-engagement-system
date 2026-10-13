import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { updateUser } from '../../api/user.api.js';

export function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    document.title = 'Settings | CMES';
  }, []);

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateUser(user._id, { name });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await updateUser(user._id, { currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  }

  function PasswordInput({ value, onChange, label, show, onToggle, placeholder }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-foreground font-body">{label}</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-10 text-sm font-body text-foreground bg-background border border-border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-1 placeholder:text-foreground/40"
          />
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
            aria-label={show ? `Hide ${label}` : `Show ${label}`}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Profile */}
        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Profile</h2>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Email"
              value={user?.email ?? ''}
              readOnly
              className="bg-stone cursor-not-allowed"
            />
            <div className="flex justify-end">
              <Button variant="primary" type="submit" loading={profileLoading}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password */}
        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent((p) => !p)}
              placeholder="Enter current password"
            />
            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((p) => !p)}
              placeholder="Enter new password"
            />
            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((p) => !p)}
              placeholder="Confirm new password"
            />
            {passwordError && (
              <p className="text-xs text-destructive font-body">{passwordError}</p>
            )}
            <div className="flex justify-end">
              <Button variant="primary" type="submit" loading={passwordLoading}>
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

export default SettingsPage;
