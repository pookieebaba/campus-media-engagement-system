import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';

const ROLE_DASHBOARDS = {
  head: '/head/dashboard',
  faculty: '/faculty/dashboard',
  student: '/student/dashboard',
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      const dest = ROLE_DASHBOARDS[user.role] ?? '/';
      navigate(dest, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Invalid credentials. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Organic decorative blob — bottom-right corner */}
      <svg
        className="absolute bottom-0 right-0 w-80 h-80 text-moss/5 pointer-events-none"
        viewBox="0 0 400 400"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M300,350 C200,380 80,340 50,250 C20,160 100,60 200,80 C300,100 400,150 380,260 C370,310 350,335 300,350Z" />
      </svg>
      {/* Top-left secondary blob */}
      <svg
        className="absolute -top-16 -left-16 w-64 h-64 text-terracotta/5 pointer-events-none"
        viewBox="0 0 300 300"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M150,20 C230,30 290,90 270,170 C250,250 170,280 90,260 C10,240 -20,160 20,90 C50,30 90,15 150,20Z" />
      </svg>

      {/* Login card */}
      <div className="w-full max-w-md bg-stone rounded-2xl shadow-card border border-border p-8 relative">
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-moss flex items-center justify-center mb-3">
            <Leaf size={24} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Campus Media Engagement
          </h1>
          <p className="text-sm font-body text-foreground/60 mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate aria-label="Login form">
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-body"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@cmes.edu"
              required
              autoComplete="email"
              autoFocus
            />

            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-foreground font-body"
              >
                Password
                <span className="text-destructive ml-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-10 text-sm font-body text-foreground bg-background border border-border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-1 placeholder:text-foreground/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-foreground/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-6"
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-center text-sm font-body text-foreground/60">
          <Link
            to="/forgot-password"
            className="text-moss font-semibold hover:text-moss-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss rounded"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
