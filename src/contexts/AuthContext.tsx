
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { User, OwnedPet, UserRole, UserStatus } from '../types';
import { USER_ROLES, USER_STATUS } from '../constants';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    updateUserProfile: (profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni' | 'avatarUrl'>>) => Promise<void>;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGhosting, setIsGhosting] = useState<User | null>(null);

    useEffect(() => {
        let mounted = true;

        // 1. Safety Timeout - Prevent infinite loading screen
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Supabase auth check timed out. Forcing app load.");
                setLoading(false);
            }
        }, 3000);

        // 2. Check active session
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await fetchProfile(session.user.email!, session.user.id);
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Error checking session:", error);
                setCurrentUser(null);
            } finally {
                if (mounted) {
                    setLoading(false);
                    clearTimeout(safetyTimeout);
                }
            }
        };

        checkUser();

        // 3. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Only fetch if we don't already have the user or if the ID changed
                if (!currentUser || currentUser.id !== session.user.id) {
                     await fetchProfile(session.user.email!, session.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (email: string, uid: string, retryCount = 0): Promise<void> => {
        if (retryCount > 2) {
            console.warn("Max retries reached for fetchProfile");
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // PGRST116: JSON object requested, multiple (or no) rows returned
                    // Self-healing for orphaned users (Auth exists, Profile missing)
                    console.log("Profile missing, creating default profile...");
                    const tempUsername = `user_${Date.now().toString().slice(-4)}_${Math.floor(Math.random() * 1000)}`;
                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: uid,
                        email: email,
                        username: tempUsername,
                        role: USER_ROLES.USER,
                        status: USER_STATUS.ACTIVE,
                        updated_at: new Date().toISOString()
                    });

                    if (!insertError) {
                        return fetchProfile(email, uid, retryCount + 1);
                    } else {
                         console.error("Error creating profile:", insertError);
                         // Fallback minimal user
                         setCurrentUser({
                            id: uid,
                            email,
                            role: USER_ROLES.USER,
                            status: USER_STATUS.ACTIVE
                         });
                    }
                } else {
                    console.error("Error fetching profile:", error);
                    // Fallback minimal user
                    setCurrentUser({
                        id: uid,
                        email,
                        role: USER_ROLES.USER,
                        status: USER_STATUS.ACTIVE
                    });
                }
            } else {
                const user: User = {
                    id: uid,
                    email: data.email,
                    role: data.role || USER_ROLES.USER,
                    status: data.status || USER_STATUS.ACTIVE,
                    username: data.username,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    phone: data.phone,
                    dni: data.dni,
                    avatarUrl: data.avatar_url,
                    ownedPets: data.owned_pets || [], 
                    savedPetIds: data.saved_pet_ids || []
                };
                setCurrentUser(user);
            }
        } catch (err) {
            console.error("Fatal error in fetchProfile:", err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, pass: string): Promise<void> => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) throw new Error(error.message);
            
            if (data.user) {
                // Force fetch profile immediately, but race with timeout to avoid "Procesando..." hang
                const timeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Tiempo de espera agotado obteniendo perfil")), 8000)
                );
                
                await Promise.race([
                    fetchProfile(data.user.email!, data.user.id),
                    timeout
                ]);
            }
        } catch (error: any) {
            console.error("Login error:", error);
            throw error;
        } finally {
            // Critical: Ensure loading is turned off no matter what
            setLoading(false);
        }
    };

    const register = async (email: string, pass: string): Promise<void> => {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw new Error(error.message);
    };

    const loginWithGoogle = async (): Promise<void> => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw new Error(error.message);
    };

    const loginWithApple = async (): Promise<void> => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
        if (error) throw new Error(error.message);
    };

    const logout = async () => {
        setLoading(true);
        
        // Optimistic logout: Clear state immediately to make UI snappy
        setCurrentUser(null);
        setIsGhosting(null);
        localStorage.removeItem('ghostingAdmin');
        
        // Try to clear Supabase session data from local storage to prevent ghost sessions
        Object.keys(localStorage).forEach(key => {
            if(key.startsWith('sb-')) localStorage.removeItem(key);
        });
        
        // Force redirect
        window.location.hash = '/';
        
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error during sign out:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateUserProfile = async (profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni' | 'avatarUrl'>>): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No auth session');
        
        const dbUpdates = {
            username: profileData.username,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            dni: profileData.dni,
            avatar_url: profileData.avatarUrl,
            updated_at: new Date().toISOString(),
        };

        const { error: updateError, data } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id)
            .select();

        if (updateError || !data || data.length === 0) {
             const { error: insertError } = await supabase
                .from('profiles')
                .insert({ id: user.id, email: user.email, ...dbUpdates });
             
             if (insertError) throw new Error((updateError || insertError)?.message);
        }

        setCurrentUser(prev => prev ? { ...prev, ...profileData } : null);
    };

    const addOwnedPet = async (petData: Omit<OwnedPet, 'id'>) => {
        if (!currentUser) return;
        
        const newPet = { ...petData, id: Date.now().toString() };
        const updatedOwnedPets = [...(currentUser.ownedPets || []), newPet];

        const { error } = await supabase
            .from('profiles')
            .update({ owned_pets: updatedOwnedPets })
            .eq('id', currentUser.id);

        if (error) throw error;
        setCurrentUser(prev => prev ? { ...prev, ownedPets: updatedOwnedPets } : null);
    };

    const updateOwnedPet = async (petData: OwnedPet) => {
        if (!currentUser) return;

        const updatedOwnedPets = (currentUser.ownedPets || []).map(p => p.id === petData.id ? petData : p);

        const { error } = await supabase
            .from('profiles')
            .update({ owned_pets: updatedOwnedPets })
            .eq('id', currentUser.id);

        if (error) throw error;
        setCurrentUser(prev => prev ? { ...prev, ownedPets: updatedOwnedPets } : null);
    };

    const deleteOwnedPet = async (petId: string) => {
        if (!currentUser) return;

        const updatedOwnedPets = (currentUser.ownedPets || []).filter(p => p.id !== petId);

        const { error } = await supabase
            .from('profiles')
            .update({ owned_pets: updatedOwnedPets })
            .eq('id', currentUser.id);

        if (error) throw error;
        setCurrentUser(prev => prev ? { ...prev, ownedPets: updatedOwnedPets } : null);
    };

    const savePet = async (petId: string) => {
        if (!currentUser) return;
        if (currentUser.savedPetIds?.includes(petId)) return;
        
        const updatedSavedIds = [...(currentUser.savedPetIds || []), petId];

        const { error } = await supabase
            .from('profiles')
            .update({ saved_pet_ids: updatedSavedIds })
            .eq('id', currentUser.id);

        if (error) throw error;
        setCurrentUser(prev => prev ? { ...prev, savedPetIds: updatedSavedIds } : null);
    };

    const unsavePet = async (petId: string) => {
        if (!currentUser) return;

        const updatedSavedIds = (currentUser.savedPetIds || []).filter(id => id !== petId);

        const { error } = await supabase
            .from('profiles')
            .update({ saved_pet_ids: updatedSavedIds })
            .eq('id', currentUser.id);

        if (error) throw error;
        setCurrentUser(prev => prev ? { ...prev, savedPetIds: updatedSavedIds } : null);
    };

    const ghostLogin = async (userToImpersonate: User) => {
        if (!currentUser || currentUser.role !== USER_ROLES.SUPERADMIN) {
            throw new Error('Acción no permitida.');
        }
        const ghostingAdmin = currentUser;
        localStorage.setItem('ghostingAdmin', JSON.stringify(ghostingAdmin));
        setIsGhosting(ghostingAdmin);
        setCurrentUser(userToImpersonate);
    };

    const stopGhosting = async () => {
        const storedAdmin = localStorage.getItem('ghostingAdmin');
        if (!storedAdmin) throw new Error('No hay sesión fantasma.');
        
        const adminUser = JSON.parse(storedAdmin);
        // Refresh admin profile to ensure valid session state
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await fetchProfile(user.email!, user.id);
        
        localStorage.removeItem('ghostingAdmin');
        setIsGhosting(null);
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
