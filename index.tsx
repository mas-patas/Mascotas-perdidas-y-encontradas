import React from 'react';
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-light">
                <p className="text-gray-600 text-lg">Cargando...</p>
            </div>
        );
    }
    
    if (!currentUser) {
        return <AuthPage />;
    }

    if (!currentUser.username) {
        return <ProfileSetupPage />;
    }
    
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