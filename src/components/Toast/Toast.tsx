import React, { useEffect } from 'react';
import './Toast.css';

export interface ToastProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <div className="toast__content">
        <span className="toast__message">{message}</span>
        <button
          className="toast__close"
          onClick={onClose}
          aria-label="Close notification"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
};
