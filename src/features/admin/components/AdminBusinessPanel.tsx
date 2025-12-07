
import React, { useState } from 'react';
import { BUSINESS_TYPES } from '@/constants';
import { BusinessType, User } from '@/types';
import { businessService } from '@/services/businessService';

interface AdminBusinessPanelProps {
    allUsers: User[];
}

const AdminBusinessPanel: React.FC<AdminBusinessPanelProps> = ({ allUsers }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<BusinessType>('Veterinaria');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        // Case-insensitive email search
        const owner = allUsers.find(u => u.email.toLowerCase() === ownerEmail.trim().toLowerCase());
        
        if (!owner || !owner.id) {
            alert('Usuario no encontrado en la base de datos. Asegúrate de que el email sea correcto y el usuario esté registrado.');
            return;
        }

        setLoading(true);
        try {
            await businessService.createBusiness({
                ownerId: owner.id,
                name,
                type,
                description: 'Descripción pendiente...',
                address: 'Dirección pendiente',
                phone: '',
                services: [],
                logoUrl: '',
                coverUrl: '',
            });
            alert('Negocio creado exitosamente. El usuario ahora puede gestionarlo desde su perfil.');
            setName('');
            setOwnerEmail('');
        } catch (error: any) {
            console.error("Creation failed:", error);
            const msg = error.message || error.error_description || JSON.stringify(error);
            alert(`Error al crear negocio: ${msg}. \n\nAsegúrate de haber ejecutado el script SQL 'schema.sql' en Supabase.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Dar de Alta Nuevo Negocio</h3>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-bold text-gray-700">Nombre del Negocio</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700">Tipo</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 border rounded">
                        {Object.values(BUSINESS_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700">Email del Dueño (Usuario Registrado)</label>
                    <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} className="w-full p-2 border rounded" required placeholder="usuario@email.com" />
                    <p className="text-xs text-gray-500 mt-1">Este usuario tendrá permisos de administración sobre la tienda.</p>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white py-2 rounded font-bold hover:bg-brand-dark disabled:opacity-50">
                    {loading ? 'Creando...' : 'Crear Negocio'}
                </button>
            </form>
        </div>
    );
};

export default AdminBusinessPanel;