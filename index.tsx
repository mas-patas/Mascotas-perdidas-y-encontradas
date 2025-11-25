
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a client with retry strategy for robust loading (Cold Starts)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2, // Increased from 1 to 2 to handle cold starts better
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Increase max delay to 10s
    },
  },
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <HashRouter>
                  <App />
              </HashRouter>
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
