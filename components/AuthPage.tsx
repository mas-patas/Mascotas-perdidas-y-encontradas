
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon, AppleIcon, WarningIcon, CheckCircleIcon } from './icons';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Honeypot field (anti-bot)
    const [website, setWebsite] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);

    const { login, register, loginWithGoogle, loginWithApple, currentUser } = useAuth();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            window.location.hash = '/';
        }
    }, [currentUser]);

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

    const calculatePasswordStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score;
    };

    const passwordStrength = calculatePasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Honeypot Check (Security)
        if (website) {
            // Silently fail if bot filled the hidden field
            console.warn("Bot detected via honeypot");
            return; 
        }

        // 2. Rate Limiting Check
        if (lockoutTime) return;

        setError('');

        if (!isLogin) {
            // Registration Validations
            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden.');
                return;
            }
            if (passwordStrength < 3) {
                setError('La contraseña es muy débil. Usa mayúsculas, números y al menos 8 caracteres.');
                return;
            }
        }

        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
                setFailedAttempts(0);
            } else {
                await register(email, password);
            }
        } catch (err: any) {
            console.error(err);
            let msg = 'Ocurrió un error.';
            
            // Translate Supabase errors
            if (err.message.includes('Invalid login credentials')) msg = 'Credenciales incorrectas.';
            else if (err.message.includes('User already registered')) msg = 'Este email ya está registrado.';
            else if (err.message.includes('Password should be')) msg = 'La contraseña es muy débil.';
            else msg = err.message;

            setError(msg);
            
            // Increment failed attempts for login
            if (isLogin) {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                if (newAttempts >= 5) {
                    setLockoutTime(Date.now() + 30000); // 30 seconds lockout
                    setError('Demasiados intentos fallidos. Espera 30 segundos.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        if (loading || lockoutTime) return;
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
        } finally {
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
                        {isLogin ? 'Inicia sesión para continuar' : 'Crea una cuenta segura'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r flex items-start gap-3" role="alert">
                        <WarningIcon />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Honeypot Field (Hidden) */}
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
                        
                        {/* Password Strength Meter (Only for Registration) */}
                        {!isLogin && password.length > 0 && (
                            <div className="mt-2">
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-300 ${
                                            passwordStrength <= 1 ? 'bg-red-500 w-1/4' :
                                            passwordStrength === 2 ? 'bg-yellow-500 w-2/4' :
                                            passwordStrength === 3 ? 'bg-blue-500 w-3/4' :
                                            'bg-green-500 w-full'
                                        }`} 
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                    {passwordStrength <= 1 ? 'Débil' : 
                                     passwordStrength === 2 ? 'Regular' : 
                                     passwordStrength === 3 ? 'Buena' : 'Fuerte'}
                                </p>
                                {passwordStrength < 3 && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        * Usa mayúsculas, números y símbolos.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {!isLogin && (
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">Confirmar Contraseña</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`${inputClass} ${confirmPassword && confirmPassword !== password ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="••••••••"
                                required
                            />
                            {confirmPassword && confirmPassword !== password && (
                                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                            )}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !!lockoutTime}
                            className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {loading ? 'Procesando...' : (
                                lockoutTime 
                                    ? `Espera ${Math.ceil((lockoutTime - Date.now()) / 1000)}s` 
                                    : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
                            )}
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
                    <button onClick={() => handleSocialLogin('google')} disabled={loading || !!lockoutTime} className={socialButtonClass}>
                        <GoogleIcon />
                        <span className="font-medium text-gray-900">Google</span>
                    </button>
                    <button onClick={() => handleSocialLogin('apple')} disabled={loading || !!lockoutTime} className={socialButtonClass}>
                        <AppleIcon />
                         <span className="font-medium text-gray-900">Apple</span>
                    </button>
                </div>


                <div className="mt-6 text-center">
                    <button 
                        onClick={() => { 
                            setIsLogin(!isLogin); 
                            setError(''); 
                            setPassword('');
                            setConfirmPassword('');
                        }} 
                        className="text-sm text-brand-primary hover:underline font-medium"
                    >
                        {isLogin ? '¿No tienes una cuenta? Regístrate gratis' : '¿Ya tienes una cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
