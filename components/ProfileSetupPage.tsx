
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfileSetupPage: React.FC = () => {
    const { currentUser, updateUserProfile } = useAuth();
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dni, setDni] = useState('');
    const [phone, setPhone] = useState('');
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
        }
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const requiredFields = [username.trim(), firstName.trim(), lastName.trim(), dni.trim(), phone.trim()];
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

        setError('');
        setLoading(true);

        try {
            await updateUserProfile({
                username: username.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dni: dni.trim(),
                phone: phone.trim(),
            });
            // Context will update and AppRouter will redirect automatically
        } catch (err: any) {
            console.error("Profile update error:", err);
            // Extract meaningful message from object or string
            const message = err.message || (typeof err === 'object' ? JSON.stringify(err) : 'Ocurrió un error al guardar el perfil.');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-white text-gray-900";

    return (
        <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-dark">
                        Completa tu Perfil
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Necesitamos algunos datos más para crear tu cuenta.
                    </p>
                </div>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4 overflow-hidden text-sm" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                         <p className="text-xs text-gray-500 mt-1">Este nombre se mostrará públicamente en la aplicación.</p>
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
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-900">Teléfono de Contacto <span className="text-red-500">*</span></label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={inputClass}
                            placeholder="987654321"
                            required
                            pattern="9[0-9]{8}"
                            title="El número de teléfono debe tener 9 dígitos y empezar con 9."
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : 'Guardar y Continuar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetupPage;
