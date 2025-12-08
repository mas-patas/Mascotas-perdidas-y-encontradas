import { useContext } from 'react';
import { ToastContext } from './ToastContext';

/**
 * Hook to access toast context
 * @throws Error if used outside ToastProvider
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};
