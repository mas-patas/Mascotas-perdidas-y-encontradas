
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './contexts/auth';
import { ToastProvider } from './contexts/toast';
import { ReactQueryProvider } from './contexts/react-query';

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

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ReactQueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </ReactQueryProvider>
    </HelmetProvider>
  </React.StrictMode>
);
