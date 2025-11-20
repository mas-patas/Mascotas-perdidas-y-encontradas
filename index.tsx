
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import ProfileSetupPage from './components/ProfileSetupPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const AppRouter: React.FC = () => {
    const { currentUser, loading } = useAuth();
    const [currentHash, setCurrentHash] = useState(window.location.hash.substring(1));

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentHash(window.location.hash.substring(1));
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-light">
                <p className="text-gray-600 text-lg">Cargando...</p>
            </div>
        );
    }
    
    // If user is logged in but hasn't completed profile setup (missing username)
    if (currentUser && !currentUser.username) {
        return <ProfileSetupPage />;
    }
    
    // If specifically trying to access login page
    if (currentHash === '/login') {
        if (currentUser) {
            window.location.hash = '/'; // Redirect to home if already logged in
            return <App />;
        }
        return <AuthPage />;
    }
    
    // For all other routes, render App (App handles protected routes internally)
    return <App />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
