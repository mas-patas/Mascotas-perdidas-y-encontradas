
import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
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
    updateUserProfile: (profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni' | 'avatarUrl' | 'country'>>) => Promise<void>;
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
    
    // Ref to track if component is mounted
    const mountedRef = useRef(true);

    // --- KEEP-ALIVE MECHANISM ---
    useEffect(() => {
        mountedRef.current = true;
        const pingSupabase = async () => {
            await supabase.auth.getSession();
        };
        const intervalId = setInterval(pingSupabase, 240000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                pingSupabase();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            mountedRef.current = false;
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Race condition protection
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: any } }>((_, reject) => 
                    setTimeout(() => reject(new Error('Auth timeout')), 8000)
                );

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
                
                if (mountedRef.current) {
                    if (session?.user) {
                        // Pass the full user object to extract metadata if needed
                        await fetchProfile(session.user);
                    } else {
                        setCurrentUser(null);
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.log("Auth init info: Defaulting to guest mode due to timeout or network.");
                if (mountedRef.current) {
                    setCurrentUser(null);
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (mountedRef.current) {
                if (session?.user) {
                    if (!currentUser || currentUser.id !== session.user.id) {
                        await fetchProfile(session.user);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setCurrentUser(null);
                    setLoading(false);
                } else {
                    if (!currentUser) setLoading(false);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (authUser: any, retryCount = 0) => {
        // Stop retrying after 3 attempts
        if (retryCount > 2) {
            if (mountedRef.current) setLoading(false);
            return;
        }

        const email = authUser.email;
        const uid = authUser.id;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Profile missing: Create it using Google/Provider Metadata if available
                    // This is the Robust Logic: Extract real data from Google
                    const metadata = authUser.user_metadata || {};
                    
                    // Generate a cleaner username from email or name
                    let baseUsername = (metadata.full_name || email.split('@')[0]).replace(/\s+/g, '_').toLowerCase();
                    const tempUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
                    
                    const firstName = metadata.given_name || metadata.full_name?.split(' ')[0] || '';
                    const lastName = metadata.family_name || metadata.full_name?.split(' ').slice(1).join(' ') || '';
                    const avatarUrl = metadata.avatar_url || metadata.picture || '';

                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: uid,
                        email: email,
                        username: tempUsername,
                        first_name: firstName,
                        last_name: lastName,
                        avatar_url: avatarUrl,
                        role: USER_ROLES.USER,
                        status: USER_STATUS.ACTIVE,
                        country: 'Perú', // Default
                        updated_at: new Date().toISOString()
                    });

                    if (!insertError) {
                        // Retry fetch after creating profile
                        return fetchProfile(authUser, retryCount + 1);
                    } else {
                        console.error("Error creating profile from OAuth:", insertError);
                    }
                }
                
                // Fallback for UI if DB insert failed
                console.warn("Using fallback profile data due to error:", error.message);
                if (mountedRef.current) {
                    setCurrentUser({
                        id: uid,
                        email,
                        role: USER_ROLES.USER,
                        status: USER_STATUS.ACTIVE,
                        country: 'Perú'
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
                    country: data.country || 'Perú',
                    avatarUrl: data.avatar_url,
                    ownedPets: data.owned_pets || [], 
                    savedPetIds: data.saved_pet_ids || []
                };
                if (mountedRef.current) setCurrentUser(user);
            }
        } catch (err) {
            console.error("Fetch profile exception:", err);
            if (mountedRef.current) {
                setCurrentUser({ id: uid, email, role: USER_ROLES.USER, country: 'Perú' });
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    };

    const login = async (email: string, pass: string): Promise<void> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw new Error(error.message);
    };

    const register = async (email: string, pass: string): Promise<void> => {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw new Error(error.message);
    };

    const loginWithGoogle = async (): Promise<void> => {
        // Robust implementation:
        // 1. redirectTo: Ensures user comes back to the correct URL (handles subdomains/deploy previews).
        // 2. prompt: 'consent' forces the Google account picker, ensuring the user can choose the correct account if they have multiple.
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });
        if (error) throw new Error(error.message);
    };

    const loginWithApple = async (): Promise<void> => {
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/`
            }
        });
        if (error) throw new Error(error.message);
    };

    const logout = async () => {
        setCurrentUser(null);
        setIsGhosting(null);
        localStorage.removeItem('ghostingAdmin');
        
        if (window.location.hash !== '#/' && window.location.hash !== '') {
            window.location.hash = '/';
        }
        
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error during sign out:", error);
        }
    };

    const updateUserProfile = async (profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni' | 'avatarUrl' | 'country'>>): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No auth session');
        
        const dbUpdates = {
            username: profileData.username,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            dni: profileData.dni,
            country: profileData.country,
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
        const { data: { user } } = await supabase.auth.getUser();
        if(user) await fetchProfile(user);
        
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
