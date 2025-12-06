

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon, WarningIcon, EyeIcon, EyeOffIcon, InfoIcon, CheckCircleIcon, ChevronLeftIcon } from './icons';

type AuthView = 'login' | 'register' | 'forgot';

const AuthPage: React.FC = () => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Honeypot field (anti-bot)
    const [website, setWebsite] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);

    const { login, loginWithGoogle, resetPassword, currentUser } = useAuth();
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    // Rate Limiting Timer
    useEffect(() => {
        if (lockoutTime) {
            const timer = setInterval(() => {
                const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
                if (remaining <= 0) {
                    setLockoutTime(null);
                    setFailedAttempts(0);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [lockoutTime]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Honeypot Check (Security)
        if (website) {
            console.warn("Bot detected via honeypot");
            return; 
        }

        // 2. Rate Limiting Check
        if (lockoutTime) return;

        setError('');
        setSuccessMessage('');
        
        const cleanEmail = email.trim();

        if (view === 'login') {
            if (!cleanEmail || !password) {
                setError('Por favor completa todos los campos.');
                return;
            }
        } else if (view === 'forgot') {
            if (!cleanEmail) {
                setError('Por favor ingresa tu email.');
                return;
            }
        } else {
            // Register via form is disabled (Google only)
            return;
        }

        setLoading(true);
        try {
            if (view === 'login') {
                await login(cleanEmail, password);
                setFailedAttempts(0);
            } else if (view === 'forgot') {
                await resetPassword(cleanEmail);
                setSuccessMessage('Si el correo está registrado, recibirás un enlace de recuperación en breve.');
            }
        } catch (err: any) {
            console.error(err);
            let msg = 'Ocurrió un error.';
            
            if (err.message.includes('Invalid login credentials')) msg = 'Credenciales incorrectas o correo no confirmado.';
            else msg = err.message;

            setError(msg);
            
            if (view === 'login') {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                if (newAttempts >= 5) {
                    setLockoutTime(Date.now() + 30000); 
                    setError('Demasiados intentos fallidos. Espera 30 segundos.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async () => {
        if (loading || socialLoading || lockoutTime) return;
        
        setError('');
        setSocialLoading(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error con el inicio de sesión social.');
            setSocialLoading(false);
        }
    }

    const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";
    const socialButtonClass = "w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white relative";

    return (
        <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-dark">
                        🐾 Mascotas Perdidas y Encontradas
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {view === 'login' ? 'Inicia sesión para continuar' 
                         : view === 'register' ? 'Crea una cuenta segura'
                         : 'Recupera tu acceso'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r flex items-start gap-3" role="alert">
                        <WarningIcon />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 mb-4 rounded-r flex items-start gap-3" role="alert">
                        <CheckCircleIcon />
                        <span className="text-sm font-medium">{successMessage}</span>
                    </div>
                )}

                {/* Login & Forgot Password Form */}
                {(view === 'login' || view === 'forgot') && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden">
                            <input 
                                type="text" 
                                name="website" 
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                tabIndex={-1}
                                autoComplete="off" 
                            />
                        </div>

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
                        
                        {view === 'login' && (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-900">Contraseña</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={inputClass}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                                <div className="mt-2 text-right">
                                    <button 
                                        type="button"
                                        onClick={() => { setView('forgot'); setError(''); setSuccessMessage(''); }}
                                        className="text-xs text-brand-primary hover:underline font-semibold"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading || !!lockoutTime || socialLoading}
                                className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                                {loading ? 'Procesando...' : (
                                    view === 'login' 
                                        ? (lockoutTime ? `Espera ${Math.ceil((lockoutTime - Date.now()) / 1000)}s` : 'Iniciar Sesión')
                                        : 'Enviar enlace de recuperación'
                                )}
                            </button>
                        </div>
                        
                        {view === 'forgot' && (
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                                    className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-1 mx-auto"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" /> Volver al inicio de sesión
                                </button>
                            </div>
                        )}
                    </form>
                )}

                {/* Register Mode - Google Only Message */}
                {view === 'register' && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6 text-center shadow-inner">
                        <div className="flex justify-center mb-3">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <InfoIcon className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Registro Exclusivo con Google</h3>
                        <p className="text-sm text-blue-700 leading-relaxed mb-4">
                            Para verificar tu identidad, el registro inicial es exclusivamente mediante Google.
                        </p>
                        <p className="text-xs text-blue-600 italic font-medium">
                            * Podrás crear una contraseña para tu cuenta en el siguiente paso para tener un acceso alternativo.
                        </p>
                    </div>
                )}

                {view !== 'forgot' && (
                    <>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">
                                    {view === 'login' ? 'O continúa con' : 'Regístrate usando'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button onClick={handleSocialLogin} disabled={loading || !!lockoutTime || socialLoading} className={socialButtonClass}>
                                {socialLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div> : <GoogleIcon />}
                                <span className="font-medium text-gray-900">Google</span>
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <button 
                                onClick={() => { 
                                    setView(view === 'login' ? 'register' : 'login'); 
                                    setError(''); 
                                    setSuccessMessage('');
                                    setPassword('');
                                }} 
                                className="text-sm text-brand-primary hover:underline font-medium"
                            >
                                {view === 'login' ? '¿No tienes una cuenta? Regístrate gratis' : '¿Ya tienes una cuenta? Inicia sesión'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthPage;