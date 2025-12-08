
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, LockIcon } from '@/shared/components/icons';
import { supabase } from '@/services/supabaseClient';

const countries = [
    "Perú", "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Ecuador", "México", "Paraguay", "Uruguay", "Venezuela", "Estados Unidos", "España", "Otro"
];

const ProfileSetupPage: React.FC = () => {
    const { currentUser, updateUserProfile, updatePassword } = useAuth();
    const navigate = useNavigate();
    
    // Personal Info
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dni, setDni] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [country, setCountry] = useState('Perú'); // Default to Peru
    
    // Password state for securing Google accounts
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Pre-fill data if available in currentUser
    useEffect(() => {
        if (currentUser) {
            // Only pre-fill if it's not a temporary generated username (starts with user_)
            if (currentUser.username && !currentUser.username.startsWith('user_')) {
                setUsername(currentUser.username);
            }
            if (currentUser.firstName) setFirstName(currentUser.firstName);
            if (currentUser.lastName) setLastName(currentUser.lastName);
            if (currentUser.dni) setDni(currentUser.dni);
            if (currentUser.phone) setPhone(currentUser.phone);
            if (currentUser.birthDate) setBirthDate(currentUser.birthDate);
            if (currentUser.country) setCountry(currentUser.country);
        }
    }, [currentUser]);

    const calculatePasswordStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score;
    };

    const passwordStrength = calculatePasswordStrength(newPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic Validation
        const requiredFields = [username.trim(), firstName.trim(), lastName.trim(), dni.trim(), phone.trim(), birthDate, country];
        if (loading || requiredFields.some(field => !field)) {
             setError("Por favor, completa todos los campos obligatorios (*).");
             return;
        }

        if (!/^\d{8}$/.test(dni.trim())) {
            setError("El DNI es obligatorio y debe contener 8 dígitos.");
            return;
        }
        
        if (!/^9\d{8}$/.test(phone.trim())) {
            setError("El Teléfono de Contacto es obligatorio, debe tener 9 dígitos y empezar con 9.");
            return;
        }

        // Age Validation (Fix: Append T00:00:00 to force local time interpretation)
        const birth = new Date(birthDate + 'T00:00:00');
        const now = new Date();
        const age = now.getFullYear() - birth.getFullYear();
        if (age < 13) {
            setError("Debes tener al menos 13 años para registrarte.");
            return;
        }

        // Password Validation
        if (!newPassword) {
            setError("Debes crear una contraseña para asegurar tu cuenta.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (passwordStrength < 2) { 
            setError("La contraseña es demasiado débil. Usa al menos 8 caracteres y una mayúscula o número.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            // --- UNIQUENESS CHECK START ---
            // Check if DNI or Phone already exists for a DIFFERENT user
            if (currentUser?.id) {
                const { data: existingUsers, error: checkError } = await supabase
                    .from('profiles')
                    .select('dni, phone')
                    .or(`dni.eq.${dni.trim()},phone.eq.${phone.trim()}`)
                    .neq('id', currentUser.id); // Exclude current user from check

                if (checkError) throw checkError;

                if (existingUsers && existingUsers.length > 0) {
                    // Determine which field failed
                    const match = existingUsers[0];
                    if (match.dni === dni.trim()) {
                        setError('Este DNI ya está registrado en otra cuenta.');
                        setLoading(false);
                        return;
                    }
                    if (match.phone === phone.trim()) {
                        setError('Este número de teléfono ya está registrado en otra cuenta.');
                        setLoading(false);
                        return;
                    }
                }
            }
            // --- UNIQUENESS CHECK END ---

            // 1. Update Profile Data
            await updateUserProfile({
                username: username.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dni: dni.trim(),
                phone: phone.trim(),
                birthDate: birthDate,
                country: country,
            });

            // 2. Set Password
            await updatePassword(newPassword);
            
            navigate('/', { replace: true });
            
        } catch (err: any) {
            console.error("Profile/Password update error:", err);
            // Handle unique constraint error from DB if frontend check was bypassed
            if (err.message?.includes('profiles_dni_key')) {
                setError('El DNI ingresado ya existe.');
            } else if (err.message?.includes('profiles_phone_key')) {
                setError('El teléfono ingresado ya existe.');
            } else {
                const message = err.message || 'Ocurrió un error al guardar el perfil.';
                setError(message);
            }
            setLoading(false);
        }
    };

    const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 my-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-dark">
                        Completa tu Perfil
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Finaliza tu registro y asegura tu cuenta para unirte a la comunidad.
                    </p>
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4 overflow-hidden text-sm" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Basic Info Section */}
                    <div className="space-y-4 border-b border-gray-100 pb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                            <span className="bg-brand-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Datos Personales
                        </h3>
                        
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-900">Nombre de Usuario <span className="text-red-500">*</span></label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={inputClass}
                                placeholder="tu_nombre_de_usuario"
                                required
                                minLength={3}
                            />
                             <p className="text-xs text-gray-500 mt-1">Este nombre se mostrará públicamente.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">Nombres <span className="text-red-500">*</span></label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={inputClass}
                                    placeholder="Juan"
                                    required
                                />
                            </div>
                             <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">Apellidos <span className="text-red-500">*</span></label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={inputClass}
                                    placeholder="Pérez"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="dni" className="block text-sm font-medium text-gray-900">DNI <span className="text-red-500">*</span></label>
                                <input
                                    id="dni"
                                    type="text"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                    className={inputClass}
                                    placeholder="12345678"
                                    required
                                    pattern="\d{8}"
                                    title="El DNI debe contener 8 dígitos numéricos."
                                />
                            </div>
                            <div>
                                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-900">Fecha de Nacimiento <span className="text-red-500">*</span></label>
                                <input
                                    id="birthDate"
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className={inputClass}
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-900">Teléfono <span className="text-red-500">*</span></label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={inputClass}
                                    placeholder="987654321"
                                    required
                                    pattern="9[0-9]{8}"
                                    title="Debe tener 9 dígitos y empezar con 9."
                                />
                            </div>
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-900">País <span className="text-red-500">*</span></label>
                                <select
                                    id="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className={inputClass}
                                    required
                                >
                                    {countries.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                            <span className="bg-brand-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                            Seguridad de la Cuenta
                        </h3>
                        
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 flex gap-2 items-start">
                            <LockIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <p>Crea una contraseña para que puedas acceder a tu cuenta con tu email si pierdes el acceso a Google.</p>
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-900">Crear Contraseña <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            
                            {newPassword.length > 0 && (
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
                                        {passwordStrength <= 1 ? 'Débil' : passwordStrength === 2 ? 'Regular' : passwordStrength === 3 ? 'Buena' : 'Fuerte'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">Confirmar Contraseña <span className="text-red-500">*</span></label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClass}
                                placeholder="Repite la contraseña"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-4 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                        >
                            {loading ? 'Guardando...' : 'Finalizar Registro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetupPage;
