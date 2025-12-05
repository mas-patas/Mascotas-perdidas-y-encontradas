
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { USER_ROLES, USER_STATUS } from '../constants';
import type { User, Campaign } from '../types';

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*');
            if (!data) return [];
            return data.map((p: any) => ({
                id: p.id,
                email: p.email,
                role: p.role || USER_ROLES.USER,
                status: p.status || USER_STATUS.ACTIVE,
                username: p.username,
                firstName: p.first_name,
                lastName: p.last_name,
                phone: p.phone,
                dni: p.dni,
                birthDate: p.birth_date,
                country: p.country,
                avatarUrl: p.avatar_url,
                ownedPets: p.owned_pets || [],
                savedPetIds: p.saved_pet_ids || []
            })) as User[];
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });
};

export const useCampaigns = () => {
    return useQuery({
        queryKey: ['campaigns'],
        queryFn: async () => {
            const { data } = await supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (!data) return [];
            return data.map((c: any) => ({
                id: c.id,
                userEmail: c.user_email,
                type: c.type,
                title: c.title,
                description: c.description,
                location: c.location,
                date: c.date,
                imageUrls: c.image_urls || [],
                contactPhone: c.contact_phone,
                lat: c.lat,
                lng: c.lng
            })) as Campaign[];
        },
        staleTime: 1000 * 60 * 5,
    });
};
