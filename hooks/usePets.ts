
import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { PET_STATUS } from '../constants';
import type { Pet, PetStatus, AnimalType, PetSize, Comment } from '../types';

const PAGE_SIZE = 12;

interface UsePetsProps {
    filters: {
        status: PetStatus | 'Todos';
        type: AnimalType | 'Todos';
        breed: string;
        color1: string;
        color2: string;
        size: PetSize | 'Todos';
    };
}

// Helper to enrich pets with owner data and comments (Shared logic)
const enrichPets = async (rawPets: any[]): Promise<Pet[]> => {
    if (rawPets.length === 0) return [];

    const petIds = rawPets.map(p => p.id);
    const userIds = [...new Set(rawPets.map(p => p.user_id).filter(Boolean))];

    // Fetch Profiles to get Emails
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

    // Fetch Comments for these specific pets
    const { data: comments } = await supabase
        .from('comments')
        .select('*')
        .in('pet_id', petIds)
        .order('created_at', { ascending: true });
        
    // Fetch Comment Likes
    let commentIds: string[] = [];
    if (comments) {
        commentIds = comments.map(c => c.id);
    }
    
    const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);

    return rawPets.map(p => {
        const owner = profiles?.find(u => u.id === p.user_id);
        const petComments = comments
            ?.filter(c => c.pet_id === p.id)
            .map(c => {
                const commentLikes = likes?.filter(l => l.comment_id === c.id).map(l => l.user_id) || [];
                return {
                    id: c.id,
                    userEmail: c.user_email,
                    userName: c.user_name,
                    text: c.text,
                    timestamp: c.created_at,
                    parentId: c.parent_id, // Mapping snake_case from DB to camelCase
                    likes: commentLikes
                };
            }) || [];

        return {
            id: p.id,
            userEmail: owner?.email || 'unknown',
            status: p.status,
            name: p.name,
            animalType: p.animal_type,
            breed: p.breed,
            color: p.color,
            size: p.size,
            location: p.location,
            date: p.date,
            contact: p.contact,
            description: p.description,
            imageUrls: p.image_urls || [],
            adoptionRequirements: p.adoption_requirements,
            shareContactInfo: p.share_contact_info,
            contactRequests: p.contact_requests || [],
            lat: p.lat,
            lng: p.lng,
            comments: petComments,
            expiresAt: p.expires_at,
            createdAt: p.created_at
        };
    });
};

export const usePets = ({ filters }: UsePetsProps) => {
    const queryClient = useQueryClient();

    const fetchPets = async ({ pageParam = 0 }) => {
        const nowIso = new Date().toISOString();
        
        if (filters.status === 'Todos') {
            // DASHBOARD MODE
            const from = pageParam * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, count, error } = await supabase
                .from('pets')
                .select('*', { count: 'exact' })
                // Filter: Show only if expires_at is in the future
                .gt('expires_at', nowIso)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            const enriched = await enrichPets(data || []);
            return { data: enriched, nextCursor: (from + (data?.length || 0) < (count || 0)) ? pageParam + 1 : undefined };

        } else {
            // FILTERED LIST MODE
            const from = pageParam * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase.from('pets').select('*', { count: 'exact' });

            query = query.eq('status', filters.status);
            
            // Filter: Show only if expires_at is in the future
            query = query.gt('expires_at', nowIso);
            
            if (filters.type !== 'Todos') query = query.eq('animal_type', filters.type);
            if (filters.breed !== 'Todos') query = query.eq('breed', filters.breed);
            if (filters.size !== 'Todos') query = query.eq('size', filters.size);
            if (filters.color1 !== 'Todos') query = query.ilike('color', `%${filters.color1}%`);
            
            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, count, error } = await query;
            if (error) throw error;

            const enriched = await enrichPets(data || []);
            return { data: enriched, nextCursor: (from + (data?.length || 0) < (count || 0)) ? pageParam + 1 : undefined };
        }
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteQuery({
        queryKey: ['pets', filters],
        queryFn: fetchPets,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        retry: 1,
        staleTime: 1000 * 60 * 1, // 1 minute stale time
    });

    // Realtime Subscription to invalidate queries
    useEffect(() => {
        const channel = supabase.channel('pets-realtime-rq')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pets' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['pets'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['pets'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    // Flatten pages for easier consumption
    const pets = data?.pages.flatMap(page => page.data) || [];

    return { 
        pets, 
        loading: isLoading, 
        hasMore: hasNextPage, 
        loadMore: fetchNextPage,
        isError,
        refetch
    };
};
