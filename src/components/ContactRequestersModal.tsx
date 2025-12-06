import React from 'react';
import type { User } from '../types';

interface ContactRequestersModalProps {
    isOpen: boolean;
    onClose: () => void;
    requesterEmails: string[];
    allUsers: User[];
    onViewUser: (user: User) => void;
}

const ContactRequestersModal: React.FC<ContactRequestersModalProps> = ({ isOpen, onClose, requesterEmails, allUsers, onViewUser }) => {
    if (!isOpen) {
        return null;
    }

    const requesters = requesterEmails
        .map(email => allUsers.find(user => user.email === email))
        .filter((user): user is User => user !== undefined);

    const handleViewProfile = (user: User) => {
        onClose(); // Close this modal first
        onViewUser(user); // Then open the new one
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b">
                    <h2 className="text-xl font-bold text-brand-dark">Usuarios que solicitaron contacto</h2>
                </div>
                <div className="p-6 overflow-y-auto">
                    {requesters.length > 0 ? (
                        <ul className="space-y-3">
                            {requesters.map(user => (
                                <li key={user.email} className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                {(user.firstName || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => handleViewProfile(user)} className="text-left w-full p-2 bg-gray-50 rounded-md border hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                        <p className="font-semibold text-brand-primary">@{user.username || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs text-gray-400">{user.email}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-8">Nadie ha solicitado el contacto para esta publicación todavía.</p>
                    )}
                </div>
                <div className="bg-gray-50 px-6 py-3 text-right rounded-b-lg border-t">
                    <button
                        type="button"
                        className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactRequestersModal;