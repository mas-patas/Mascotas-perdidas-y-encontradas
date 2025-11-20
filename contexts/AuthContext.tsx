
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

        // 1. Safety Timeout: Force loading to false after 5 seconds to prevent infinite loading screens
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Supabase auth check timed out. Forcing app load.");
                setLoading(false);
            }
        }, 5000);

        // 2. Check active session on mount
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

        // 3. Listen for auth changes (login, logout, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchProfile(session.user.email!, session.user.id);
            } else {
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

    const fetchProfile = async (email: string, uid: string, retryCount = 0) => {
        if (retryCount > 2) {
            console.error("Max retries reached for fetching profile.");
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
                // Error code PGRST116 means "The result contains 0 rows" (Profile deleted manually or not created)
                if (error.code === 'PGRST116') {
                    console.warn("Perfil no encontrado (Usuario Huérfano). Intentando autoreparación...");
                    
                    // Self-healing: Insert a new basic profile for this existing Auth user.
                    // IMPORTANT: Generate a unique temporary username to avoid unique constraint violations.
                    const tempUsername = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                    
                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: uid,
                        email: email,
                        username: tempUsername,
                        role: USER_ROLES.USER,
                        status: USER_STATUS.ACTIVE,
                        updated_at: new Date().toISOString()
                    });

                    if (!insertError) {
                        console.log("Perfil recreado exitosamente.");
                        // Recursive call to fetch the newly created profile
                        return fetchProfile(email, uid, retryCount + 1);
                    } else {
                         console.error("Error al recrear perfil:", insertError);
                         // Fallback basic user so app doesn't crash completely even if DB write failed
                         setCurrentUser({
                            id: uid,
                            email,
                            role: USER_ROLES.USER,
                            status: USER_STATUS.ACTIVE
                         });
                    }
                } else {
                    console.warn("Error obteniendo perfil:", error.message);
                    // Fallback basic user
                    setCurrentUser({
                        id: uid,
                        email,
                        role: USER_ROLES.USER,
                        status: USER_STATUS.ACTIVE
                    });
                }
            } else {
                // Map snake_case DB columns to camelCase User type
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
                    ownedPets: [], 
                    savedPetIds: []
                };
                setCurrentUser(user);
            }
        } catch (err) {
            console.error("Error fatal en fetchProfile:", err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, pass: string): Promise<void> => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });
        if (error) throw new Error(error.message);
    };

    const register = async (email: string, pass: string): Promise<void> => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
        });

        if (error) throw new Error(error.message);
        // We don't need to insert DNI manually here. 
        // The Supabase Trigger (handle_new_user) creates the profile row automatically.
        // The user will be prompted to fill in details (DNI, Name) in the ProfileSetupPage upon first login.
    };

    const loginWithGoogle = async (): Promise<void> => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) throw new Error(error.message);
    };

    const loginWithApple = async (): Promise<void> => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
        });
        if (error) throw new Error(error.message);
    };

    const logout = async () => {
        // 1. Perform local cleanup IMMEDIATELY to update UI
        setCurrentUser(null);
        setIsGhosting(null);
        localStorage.removeItem('ghostingAdmin');
        
        // Force redirect to home/login view if currently on a protected route
        if (window.location.hash !== '#/' && window.location.hash !== '') {
            window.location.hash = '/';
        }

        // 2. Perform server-side sign out in background
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error during sign out (server-side):", error);
            // We don't really care if this fails, as the user is already logged out locally
        }
    };

    const updateUserProfile = async (profileData: Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'phone' | 'dni' | 'avatarUrl'>>): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No auth session');
        
        // Map camelCase to snake_case for DB
        const dbUpdates = {
            username: profileData.username,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
            dni: profileData.dni,
            avatar_url: profileData.avatarUrl,
            updated_at: new Date().toISOString(), // Safe string format
        };

        // Strategy: Try UPDATE first. If it fails (row missing), try INSERT.
        
        // 1. Try Update
        const { error: updateError, data } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id)
            .select();

        if (updateError || !data || data.length === 0) {
             // 2. If Update failed or no row found, try Insert (Upsert-like fallback)
             const { error: insertError } = await supabase
                .from('profiles')
                .insert({ id: user.id, email: user.email, ...dbUpdates });
             
             if (insertError) {
                 console.error("Profile update failed:", updateError || insertError);
                 throw new Error((updateError || insertError)?.message);
             }
        }

        // Refresh local state
        setCurrentUser(prev => prev ? { ...prev, ...profileData } : null);
    };

    // Placeholder implementations for Owned Pets (To be migrated to DB tables later)
    const addOwnedPet = async (petData: Omit<OwnedPet, 'id'>) => {
        console.log("addOwnedPet not yet connected to DB");
    };

    const updateOwnedPet = async (petData: OwnedPet) => {
        console.log("updateOwnedPet not yet connected to DB");
    };

    const deleteOwnedPet = async (petId: string) => {
        console.log("deleteOwnedPet not yet connected to DB");
    };

    const savePet = async (petId: string) => {
        console.log("savePet not yet connected to DB");
    };

    const unsavePet = async (petId: string) => {
        console.log("unsavePet not yet connected to DB");
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
        if(user) await fetchProfile(user.email!, user.id);
        
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
