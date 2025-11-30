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

// --- NUCLEAR OPTION: FORCE UNREGISTER ALL SERVICE WORKERS ---
// This ensures that any old, buggy, or caching SW is completely removed.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('Force Unregistering SW:', registration);
      registration.unregister();
    }
  });
}

// Create a client with retry strategy for robust loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1, 
      retryDelay: 1000, 
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