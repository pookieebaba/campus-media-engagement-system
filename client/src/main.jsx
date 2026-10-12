import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Placeholder root — full app wired in FEAT-003
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="flex items-center justify-center min-h-screen bg-background">
      <h1 className="font-heading text-2xl text-foreground">
        CMES — Campus Media Engagement System
      </h1>
    </div>
  </React.StrictMode>
);
