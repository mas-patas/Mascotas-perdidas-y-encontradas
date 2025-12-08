import React, { useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ToastContainer } from '@/shared';
import { ToastContext } from './ToastContext';
import type { ToastContextType, Toast, ToastType } from './toast.types';


export const ToastProvider = ({ children }: React.PropsWithChildren) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextType = useMemo(() => ({
    showToast,
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};
