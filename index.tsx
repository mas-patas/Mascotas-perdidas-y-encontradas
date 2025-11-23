
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

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
      retry: 1, // Reduced from 3 to fail faster
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Max 3s delay
    },
  },
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
              <HashRouter>
                  <App />
              </HashRouter>
          </AuthProvider>
        </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
