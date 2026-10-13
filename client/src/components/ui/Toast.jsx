import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
const TOAST_DURATION = 4000;

const typeConfig = {
  success: {
    icon: CheckCircle,
    classes: 'border-moss/30 bg-moss/5',
    iconClass: 'text-moss',
  },
  error: {
    icon: XCircle,
    classes: 'border-destructive/30 bg-destructive/5',
    iconClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-terracotta/30 bg-terracotta/5',
    iconClass: 'text-terracotta',
  },
  info: {
    icon: Info,
    classes: 'border-border bg-stone',
    iconClass: 'text-foreground/60',
  },
};

// ─── Context ────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info', duration = TOAST_DURATION) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => add(msg, 'success', dur),
    error: (msg, dur) => add(msg, 'error', dur),
    warning: (msg, dur) => add(msg, 'warning', dur),
    info: (msg, dur) => add(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <ToastContainer toasts={toasts} onRemove={remove} />,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Individual Toast ────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const config = typeConfig[toast.type] ?? typeConfig.info;
  const Icon = config.icon;
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-start gap-3 w-full max-w-sm',
        'px-4 py-3 rounded-2xl border shadow-card',
        'bg-background font-body text-sm text-foreground',
        'animate-in slide-in-from-right-4 fade-in duration-200',
        config.classes,
      ].join(' ')}
    >
      <Icon size={18} className={['mt-0.5 shrink-0', config.iconClass].join(' ')} aria-hidden="true" />
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-0.5 rounded-full hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Container ───────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
