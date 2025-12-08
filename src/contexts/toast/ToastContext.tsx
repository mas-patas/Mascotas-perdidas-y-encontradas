import { createContext } from 'react';
import type { ToastContextType } from './toast.types';

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
