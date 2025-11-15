import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { User, OwnedPet, UserRole, UserStatus } from '../types';
import { USER_ROLES, USER_STATUS } from '../constants';
import { initialUsersForDemo } from '../data/users';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, dni: string) => Promise<void>;
    logout: () => void;
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    updateUserProfile: (profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni'>>) => Promise<void>;
    addOwnedPet: (petData: Omit<OwnedPet, 'id'>) => Promise<void>;
    updateOwnedPet: (petData: OwnedPet) => Promise<void>;
    deleteOwnedPet: (petId: string) => Promise<void>;
    savePet: (petId: string) => Promise<void>;
    unsavePet: (petId: string) => Promise<void>;
    isGhosting: User | null;
    ghostLogin: (userToImpersonate: User) => Promise<void>;
    stopGhosting: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

// This function is now only used for the one-time migration of users without a role.
const getRoleForUserByEmail = (email: string): UserRole => {
    if (email === 'super@admin.com' || email === 'roger1771@gmail.com') return USER_ROLES.SUPERADMIN;
    if (email === 'admin@admin.com') return USER_ROLES.ADMIN;
    if (email === 'mod@moderator.com') return USER_ROLES.MODERATOR;
    return USER_ROLES.USER;
};


export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGhosting, setIsGhosting] = useState<User | null>(null);

    useEffect(() => {
        try {
            // Seed/update demo user data and migrate existing users.
            const allUsersData = JSON.parse(localStorage.getItem('users') || '{}');
            const userProfiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
    
            const demoUsers: { [email: string]: string } = {};
            const demoProfiles: { [email: string]: any } = {};
    
            initialUsersForDemo.forEach(user => {
                demoUsers[user.email] = '123456'; // Set/reset default password
                const { email, ...profileWithRole } = user; // Keep the role in the profile object
                demoProfiles[email] = profileWithRole;
            });
            
            // Merge demo data, overwriting existing demo user entries to reset them.
            const finalProfiles = { ...userProfiles, ...demoProfiles };
            const finalUsers = { ...allUsersData, ...demoUsers };

            // Migration step: ensure all users have a role in their profile
            Object.keys(finalUsers).forEach(email => {
                if (finalProfiles[email] && !finalProfiles[email].role) {
                     finalProfiles[email].role = getRoleForUserByEmail(email);
                }
            });
    
            localStorage.setItem('users', JSON.stringify(finalUsers));
            localStorage.setItem('userProfiles', JSON.stringify(finalProfiles));
    
            // Now, attempt to load the logged-in user and ghost session
            const storedUser = localStorage.getItem('currentUser');
            const ghostingAdmin = localStorage.getItem('ghostingAdmin');

            if (ghostingAdmin) {
                setIsGhosting(JSON.parse(ghostingAdmin));
            }

            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                // Refresh the user data from our freshly seeded/migrated profiles
                const freshProfile = finalProfiles[parsedUser.email] || {};
                const freshUser = { ...parsedUser, ...freshProfile }; // The role is now part of the profile
    
                localStorage.setItem('currentUser', JSON.stringify(freshUser));
                setCurrentUser(freshUser);
            }
        } catch (error) {
            console.error("Failed to initialize auth state", error);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('ghostingAdmin');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, pass: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => { // Simula la latencia de la red
                const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
                if (storedUsers[email] && storedUsers[email] === pass) {
                    const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
                    const userProfile = profiles[email] || {};

                    if (userProfile.status === USER_STATUS.INACTIVE) {
                        reject(new Error('Tu cuenta ha sido desactivada por un administrador.'));
                        return;
                    }
                    
                    const user: User = { 
                        email, 
                        provider: 'email',
                        ...userProfile // This includes the role from the profile
                    };
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    setCurrentUser(user);
                    resolve();
                } else {
                    reject(new Error('Credenciales inválidas.'));
                }
            }, 500);
        });
    };

    const register = async (email: string, pass: string, dni: string): Promise<void> => {
         return new Promise((resolve, reject) => {
            setTimeout(() => { // Simula la latencia de la red
                const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
                const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
                if (storedUsers[email]) {
                    reject(new Error('El usuario ya existe.'));
                } else if (Object.values(profiles).some((p: any) => p.dni === dni)) {
                    reject(new Error('El DNI ya está registrado.'));
                } else {
                    const newUsers = { ...storedUsers, [email]: pass };
                    localStorage.setItem('users', JSON.stringify(newUsers));

                    const newUserProfile = { 
                        status: USER_STATUS.ACTIVE, 
                        dni,
                        role: USER_ROLES.USER // Assign default user role
                    };

                    const newProfiles = { ...profiles, [email]: newUserProfile };
                    localStorage.setItem('userProfiles', JSON.stringify(newProfiles));

                    const user: User = { email, provider: 'email', ...newUserProfile };
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    setCurrentUser(user);
                    resolve();
                }
            }, 500);
        });
    };

    const socialLogin = (user: User): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => { // Simula la latencia de la red
                const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
                let userProfile = profiles[user.email] || {};

                if (userProfile.status === USER_STATUS.INACTIVE) {
                     reject(new Error('Tu cuenta ha sido desactivada por un administrador.'));
                     return;
                }

                if (!userProfile.status) userProfile.status = USER_STATUS.ACTIVE;
                if (!userProfile.role) userProfile.role = USER_ROLES.USER; // Assign default role if missing

                const updatedProfiles = { ...profiles, [user.email]: userProfile };
                localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
                
                const fullUser: User = {
                    ...user,
                    ...userProfile,
                };
                localStorage.setItem('currentUser', JSON.stringify(fullUser));
                setCurrentUser(fullUser);
                resolve();
            }, 300);
        });
    };

    const loginWithGoogle = async (): Promise<void> => {
        const user: User = { email: 'user@gmail.com', provider: 'google', role: USER_ROLES.USER }; // Role is just a default, will be overridden by profile
        return socialLogin(user);
    };

    const loginWithApple = async (): Promise<void> => {
        const user: User = { email: 'user@icloud.com', provider: 'apple', role: USER_ROLES.USER }; // Role is just a default, will be overridden by profile
        return socialLogin(user);
    };
    
    const updateUserProfile = async (profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni'>>): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate network latency
                if (!currentUser) {
                    return reject(new Error('No hay un usuario autenticado.'));
                }
                const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');

                const { username = '', firstName = '', lastName = '', dni = '', phone = '' } = { ...currentUser, ...profileData };

                if (profileData.username !== undefined || profileData.dni !== undefined) {
                    if (!username || !firstName || !lastName || !dni || !phone) {
                        return reject(new Error('Usuario, nombres, apellidos, DNI y teléfono son obligatorios.'));
                    }
                    if (username.length < 3) {
                        return reject(new Error('El nombre de usuario debe tener al menos 3 caracteres.'));
                    }
                    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                        return reject(new Error('El nombre de usuario solo puede contener letras, números y guiones bajos.'));
                    }
                     if (!/^\d{8}$/.test(dni)) {
                        return reject(new Error('El DNI debe tener 8 dígitos.'));
                    }
                     if (!/^9\d{8}$/.test(phone)) {
                        return reject(new Error('El número de teléfono debe tener 9 dígitos y empezar con 9.'));
                    }
                    
                    const isUsernameTaken = Object.entries(profiles).some(([email, profile]: [string, any]) => 
                        email !== currentUser.email && profile.username === username
                    );
                    if (isUsernameTaken) {
                        return reject(new Error('Este nombre de usuario ya está en uso.'));
                    }
            
                    const isDniTaken = Object.entries(profiles).some(([email, profile]: [string, any]) => 
                        email !== currentUser.email && profile.dni === dni
                    );
                     if (isDniTaken) {
                        return reject(new Error('Este DNI ya está registrado.'));
                    }
                }
                
                if (profileData.firstName !== undefined && !profileData.firstName) {
                    return reject(new Error('El nombre es obligatorio.'));
                }
                 if (profileData.lastName !== undefined && !profileData.lastName) {
                    return reject(new Error('El apellido es obligatorio.'));
                }


                const existingProfile = profiles[currentUser.email] || {};
                const updatedProfileData = { ...existingProfile, ...profileData };

                const updatedUser = { ...currentUser, ...updatedProfileData };
                const updatedProfiles = { ...profiles, [currentUser.email]: updatedProfileData };

                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
                setCurrentUser(updatedUser);
                resolve();
            }, 500);
        });
    };
    
    const addOwnedPet = async (petData: Omit<OwnedPet, 'id'>): Promise<void> => {
        return new Promise((resolve) => {
             setTimeout(() => {
                const newPet: OwnedPet = { ...petData, id: new Date().toISOString() };
                
                setCurrentUser(latestCurrentUser => {
                    if (!latestCurrentUser) return null;
                    
                    const updatedOwnedPets = [...(latestCurrentUser.ownedPets || []), newPet];
                    const updatedUser = { ...latestCurrentUser, ownedPets: updatedOwnedPets };

                    try {
                        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
                        const existingProfile = profiles[latestCurrentUser.email] || {};
                        const updatedProfileData = { ...existingProfile, ownedPets: updatedOwnedPets };
                        const updatedProfiles = { ...profiles, [latestCurrentUser.email]: updatedProfileData };

                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
                    } catch (e) {
                         console.error("Failed to update localStorage:", e);
                    }

                    return updatedUser;
                });
                resolve();
            }, 300);
        });
    };

    const updateOwnedPet = async (updatedPet: OwnedPet): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                setCurrentUser(latestCurrentUser => {
                    if (!latestCurrentUser) return null;

                    const updatedOwnedPets = (latestCurrentUser.ownedPets || []).map(p => p.id === updatedPet.id ? updatedPet : p);
                    const updatedUser = { ...latestCurrentUser, ownedPets: updatedOwnedPets };

                    try {
                        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
                        const existingProfile = profiles[latestCurrentUser.email] || {};
                        const updatedProfileData = { ...existingProfile, ownedPets: updatedOwnedPets };
                        const updatedProfiles = { ...profiles, [latestCurrentUser.email]: updatedProfileData };

                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
                    } catch (e) {
                        console.error("Failed to update localStorage:", e);
                    }

                    return updatedUser;
                });
                resolve();
            }, 200);
        });
    };

    const deleteOwnedPet = async (petId: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                setCurrentUser(latestCurrentUser => {
                    if (!latestCurrentUser) return null;

                    const updatedOwnedPets = (latestCurrentUser.ownedPets || []).filter(p => p.id !== petId);
                    const updatedUser = { ...latestCurrentUser, ownedPets: updatedOwnedPets };

                    try {
                        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
                        const existingProfile = profiles[latestCurrentUser.email] || {};
                        const updatedProfileData = { ...existingProfile, ownedPets: updatedOwnedPets };
                        const updatedProfiles = { ...profiles, [latestCurrentUser.email]: updatedProfileData };

                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
                    } catch (e) {
                        console.error("Failed to update localStorage:", e);
                    }
                    
                    return updatedUser;
                });
                resolve();
            }, 200);
        });
    };

    const savePet = async (petId: string): Promise<void> => {
        return new Promise((resolve) => {
             setTimeout(() => {
                setCurrentUser(latestCurrentUser => {
                    if (!latestCurrentUser) return null;
                    
                    const savedIds = latestCurrentUser.savedPetIds || [];
                    if (savedIds.includes(petId)) return latestCurrentUser;

                    const updatedSavedPetIds = [...savedIds, petId];
                    const updatedUser = { ...latestCurrentUser, savedPetIds: updatedSavedPetIds };

                    try {
                        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
                        const existingProfile = profiles[latestCurrentUser.email] || {};
                        const updatedProfileData = { ...existingProfile, savedPetIds: updatedSavedPetIds };
                        const updatedProfiles = { ...profiles, [latestCurrentUser.email]: updatedProfileData };

                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
                    } catch (e) {
                        console.error("Failed to update localStorage:", e);
                    }
                    return updatedUser;
                });
                resolve();
            }, 200);
        });
    };

    const unsavePet = async (petId: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                setCurrentUser(latestCurrentUser => {
                    if (!latestCurrentUser) return null;

                    const savedIds = latestCurrentUser.savedPetIds || [];
                    const updatedSavedPetIds = savedIds.filter(id => id !== petId);
                    const updatedUser = { ...latestCurrentUser, savedPetIds: updatedSavedPetIds };

                    try {
                        const profiles = JSON.parse(localStorage.getItem('userProfiles') || '{}');
                        const existingProfile = profiles[latestCurrentUser.email] || {};
                        const updatedProfileData = { ...existingProfile, savedPetIds: updatedSavedPetIds };
                        const updatedProfiles = { ...profiles, [latestCurrentUser.email]: updatedProfileData };

                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
                    } catch (e) {
                         console.error("Failed to update localStorage:", e);
                    }
                    return updatedUser;
                });
                resolve();
            }, 200);
        });
    };

    const logout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('ghostingAdmin');
        setCurrentUser(null);
        setIsGhosting(null);
    };

    const ghostLogin = async (userToImpersonate: User): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!currentUser || currentUser.role !== USER_ROLES.SUPERADMIN) {
                return reject(new Error('Acción no permitida.'));
            }
            const ghostingAdmin = currentUser;
            localStorage.setItem('ghostingAdmin', JSON.stringify(ghostingAdmin));
            localStorage.setItem('currentUser', JSON.stringify(userToImpersonate));
            setIsGhosting(ghostingAdmin);
            setCurrentUser(userToImpersonate);
            resolve();
        });
    };

    const stopGhosting = async (): Promise<void> => {
        return new Promise((resolve, reject) => {
            const storedAdmin = localStorage.getItem('ghostingAdmin');
            if (!storedAdmin) {
                return reject(new Error('No hay sesión fantasma activa.'));
            }
            const adminUser = JSON.parse(storedAdmin);
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            localStorage.removeItem('ghostingAdmin');
            setCurrentUser(adminUser);
            setIsGhosting(null);
            resolve();
        });
    };

    const value = {
        currentUser,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithApple,
        updateUserProfile,
        addOwnedPet,
        updateOwnedPet,
        deleteOwnedPet,
        savePet,
        unsavePet,
        isGhosting,
        ghostLogin,
        stopGhosting,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};