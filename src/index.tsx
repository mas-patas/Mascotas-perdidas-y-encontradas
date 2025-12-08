
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/auth';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// --- NUCLEAR OPTION: FORCE UNREGISTER ALL SERVICE WORKERS ---
// Modified to run only after load to prevent "The document is in an invalid state" error
// window.addEventListener('load', () => {
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.getRegistrations().then(function(registrations) {
//       for(let registration of registrations) {
//         console.log('Force Unregistering SW:', registration);
//         registration.unregister().catch(err => console.warn('Unregister failed:', err));
//       }
//     }).catch(err => {
//       console.warn('Service Worker unregistration skipped:', err);
//     });
//   }
// });

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
          <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
                  <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
