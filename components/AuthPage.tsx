
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon, AppleIcon, WarningIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from './icons';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    
    // Honeypot field (anti-bot)
    const [website, setWebsite] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);

    const { login, register, loginWithGoogle, loginWithApple, currentUser } = useAuth();
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
            console.warn("Bot detected via honeypot");
            return; 
        }

        // 2. Rate Limiting Check
        if (lockoutTime) return;

        setError('');
        
        const cleanEmail = email.trim();

        if (!isLogin) {
            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden.');
                return;
            }
            if (passwordStrength < 3) {
                setError('La contraseña es muy débil. Usa mayúsculas, números y al menos 8 caracteres.');
                return;
            }
            if (!acceptedTerms) {
                setError('Debes aceptar los Términos y Condiciones para crear una cuenta.');
                return;
            }
        }

        setLoading(true);
        try {
            if (isLogin) {
                await login(cleanEmail, password);
                setFailedAttempts(0);
            } else {
                await register(cleanEmail, password);
            }
        } catch (err: any) {
            console.error(err);
            let msg = 'Ocurrió un error.';
            
            if (err.message.includes('Invalid login credentials')) msg = 'Credenciales incorrectas o correo no confirmado.';
            else if (err.message.includes('User already registered')) msg = 'Este email ya está registrado.';
            else if (err.message.includes('Password should be')) msg = 'La contraseña es muy débil.';
            else if (err.message.toLowerCase().includes('invalid') && err.message.toLowerCase().includes('email')) msg = 'El formato del correo electrónico no es válido.';
            else msg = err.message;

            setError(msg);
            
            if (isLogin) {
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

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        if (loading || socialLoading || lockoutTime) return;
        
        setError('');
        setSocialLoading(true);
        try {
            if (provider === 'google') {
                await loginWithGoogle();
            } else {
                await loginWithApple();
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error con el inicio de sesión social.');
            setSocialLoading(false);
        }
        // Note: We don't setSocialLoading(false) on success because the page will redirect
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
                                minLength={6}
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
                            </div>
                        )}
                    </div>

                    {!isLogin && (
                        <>
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

                            <div className="flex items-start gap-2 pt-1">
                                <input 
                                    id="terms" 
                                    type="checkbox" 
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600 select-none">
                                    He leído y acepto los <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-semibold">Términos y Condiciones</Link>
                                </label>
                            </div>
                        </>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !!lockoutTime || socialLoading}
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
                    <button onClick={() => handleSocialLogin('google')} disabled={loading || !!lockoutTime || socialLoading} className={socialButtonClass}>
                        {socialLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div> : <GoogleIcon />}
                        <span className="font-medium text-gray-900">Google</span>
                    </button>
                    <button onClick={() => handleSocialLogin('apple')} disabled={loading || !!lockoutTime || socialLoading} className={socialButtonClass}>
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
                            setAcceptedTerms(false);
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
