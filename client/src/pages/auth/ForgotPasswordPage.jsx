import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../api/auth.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch {
      // Always show success to avoid user enumeration
      setSubmitted(true);
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
            Reset Password
          </h1>
          <p className="text-sm font-body text-foreground/60 mt-1 text-center">
            Enter your email to receive a reset link
          </p>
        </div>

        {submitted ? (
          <div
            role="status"
            aria-live="polite"
            className="text-center space-y-4"
          >
            <div className="px-4 py-4 rounded-xl bg-moss/10 border border-moss/20 text-sm text-moss font-body">
              If an account exists with that email, you'll receive a password reset link shortly.
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-moss hover:text-moss-dark transition-colors font-body"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div
                role="alert"
                className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-body"
              >
                {error}
              </div>
            )}

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

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-6"
              size="lg"
            >
              Send Reset Link
            </Button>

            <p className="mt-4 text-center text-sm font-body">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-moss font-semibold hover:text-moss-dark transition-colors"
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
