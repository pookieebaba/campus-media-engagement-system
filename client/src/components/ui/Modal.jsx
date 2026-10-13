import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  className = '',
}) {
  const modalRef = useRef(null);

  // Focus trap + close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    const modal = modalRef.current;

    // Focus the modal container so screen readers announce it
    if (modal) modal.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key === 'Tab' && modal) {
        const focusable = modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={[
          'relative w-full bg-background rounded-2xl shadow-moss',
          'border border-border p-6',
          'focus:outline-none',
          sizeClasses[size] ?? sizeClasses.md,
          className,
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {title && (
            <h2
              id="modal-title"
              className="font-heading text-xl font-semibold text-foreground"
            >
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1 rounded-full text-foreground/60 hover:text-foreground hover:bg-stone transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
