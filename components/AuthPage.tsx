
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon, AppleIcon } from './icons';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register, loginWithGoogle, loginWithApple, currentUser } = useAuth();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            window.location.hash = '/';
        }
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error.');
            setLoading(false); // Ensure loading is reset on error
        }
        // Note: We don't set loading(false) on success here because the app will redirect/reload
        // and setting it might cause a flicker. However, if redirection is handled by useEffect,
        // we might want to reset it if the component persists.
        // For now, rely on useEffect redirect or error catch.
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        if (loading) return;
        setError('');
        setLoading(true);
        try {
            if (provider === 'google') {
                await loginWithGoogle();
            } else {
                await loginWithApple();
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error con el inicio de sesión social.');
            setLoading(false);
        }
    }

    const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";
    const socialButtonClass = "w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

    return (
        <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-dark">
                        🐾 Mascotas Perdidas y Encontradas
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {isLogin ? 'Inicia sesión para continuar' : 'Crea una cuenta para empezar'}
                    </p>
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClass}
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-900">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClass}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                        </button>
                    </div>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">O continúa con</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button onClick={() => handleSocialLogin('google')} disabled={loading} className={socialButtonClass}>
                        <GoogleIcon />
                        <span className="font-medium text-gray-900">Continuar con Google</span>
                    </button>
                    <button onClick={() => handleSocialLogin('apple')} disabled={loading} className={socialButtonClass}>
                        <AppleIcon />
                         <span className="font-medium text-gray-900">Continuar con Apple</span>
                    </button>
                </div>


                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-brand-primary hover:underline">
                        {isLogin ? '¿No tienes una cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
