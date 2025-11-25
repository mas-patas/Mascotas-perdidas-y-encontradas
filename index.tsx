
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

// Robust Service Worker Registration
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    // Use window.location.origin to ensure the path is absolute
    const swUrl = `${window.location.origin}/sw.js`;
    
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        // Suppress specific errors common in previews/iframes to avoid console noise
        const msg = registrationError.message || '';
        if (msg.includes('invalid state') || msg.includes('script evaluation failed') || msg.includes('document is in an invalid state')) {
            return;
        }
        console.warn('SW registration note: ', msg);
      });
  }
};

// Execute registration logic based on document state
if (document.readyState === 'complete') {
  registerServiceWorker();
} else {
  window.addEventListener('load', registerServiceWorker);
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
