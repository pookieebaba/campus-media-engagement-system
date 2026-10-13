import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-stone flex items-center justify-center mb-6">
        <Compass size={32} className="text-foreground/30" aria-hidden="true" />
      </div>
      <h1 className="font-heading text-5xl font-semibold text-foreground mb-2">404</h1>
      <h2 className="font-heading text-xl text-foreground/70 mb-4">Page Not Found</h2>
      <p className="text-sm font-body text-foreground/50 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center px-6 py-3 bg-moss text-white font-semibold font-body text-sm rounded-full hover:bg-moss-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2"
      >
        Go home
      </Link>
    </div>
  );
}

export default NotFoundPage;
