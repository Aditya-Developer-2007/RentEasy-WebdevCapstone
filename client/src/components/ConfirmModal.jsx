import { useEffect } from 'react';
import { CloseIcon } from './Icons';

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className="surface-card modal-card modal-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="modal-header">
          <h2 id="confirm-modal-title" style={{ fontSize: 18 }}>
            {title}
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label="Close modal"
            disabled={isLoading}
            onClick={onCancel}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="modal-scroll-body">
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-secondary)' }}>
            {description}
          </p>
        </div>

        <div className="modal-footer-sticky">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isLoading}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
