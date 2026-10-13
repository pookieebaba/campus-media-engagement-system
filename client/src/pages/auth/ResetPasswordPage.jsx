import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '../../api/auth.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { isStrongPassword } from '../../utils/validators.js';

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isStrongPassword(password)) {
      setError('Password must be at least 8 characters with one uppercase letter and one number.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Reset link is invalid or has expired.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-stone rounded-2xl shadow-card border border-border p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-moss flex items-center justify-center mb-3">
            <Leaf size={24} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Set New Password
          </h1>
          <p className="text-sm font-body text-foreground/60 mt-1">
            Choose a strong password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-body"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="new-password"
                className="text-sm font-semibold text-foreground font-body"
              >
                New password
                <span className="text-destructive ml-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 text-sm font-body text-foreground bg-background border border-border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-1 placeholder:text-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-foreground/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-foreground/50 font-body">
                Min. 8 characters, 1 uppercase, 1 number
              </p>
            </div>

            <Input
              label="Confirm password"
              type="password"
              id="confirm-password"
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-6"
            size="lg"
          >
            Reset Password
          </Button>

          <p className="mt-4 text-center text-sm font-body">
            <Link
              to="/login"
              className="text-moss font-semibold hover:text-moss-dark transition-colors"
            >
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
