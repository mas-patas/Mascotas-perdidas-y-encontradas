

import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { PET_STATUS } from '../constants';
import type { Pet, PetStatus, AnimalType, PetSize, Comment } from '../types';

const LIST_PAGE_SIZE = 12;

interface UsePetsProps {
    filters: {
        status: PetStatus | 'Todos';
        type: AnimalType | 'Todos';
        breed: string;
        color1: string;
        color2: string;
        size: PetSize | 'Todos';
        department: string;
    };
}

// Helper to enrich pets with owner data and comments (Shared logic)
const enrichPets = async (rawPets: any[]): Promise<Pet[]> => {
    if (!rawPets || rawPets.length === 0) return [];

    // Deduplicate IDs and filter out invalid entries (nulls or missing IDs)
    const validPets = rawPets.filter(p => p && p.id);
    const uniquePets = Array.from(new Map(validPets.map(p => [p.id, p])).values());
    
    if (uniquePets.length === 0) return [];

    const petIds = uniquePets.map(p => p.id);
    const userIds = [...new Set(uniquePets.map(p => p.user_id).filter(Boolean))];

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

    return uniquePets.map(p => {
        const owner = profiles?.find(u => u.id === p.user_id);
        const petComments = comments
            ?.filter(c => c.pet_id === p.id)
            .map(c => {
                const commentLikes = likes?.filter(l => l.comment_id === c.id).map(l => l.user_id) || [];
                return {
                    id: c.id,
                    userId: c.user_id, // Map database user_id to type
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
            reward: p.reward,
            currency: p.currency, // Map currency field
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
            // DASHBOARD MODE: Parallel Queries for "Top 10" of each category
            // Only fetch if it's the first page (pageParam 0). Dashboard doesn't support infinite scroll the same way.
            if (pageParam > 0) return { data: [], nextCursor: undefined };

            const categories = [
                PET_STATUS.PERDIDO,
                PET_STATUS.ENCONTRADO,
                PET_STATUS.AVISTADO,
                PET_STATUS.EN_ADOPCION,
                PET_STATUS.REUNIDO
            ];

            const promises = categories.map(status => {
                let query = supabase
                    .from('pets')
                    .select('*')
                    .eq('status', status)
                    .gt('expires_at', nowIso);
                
                // Apply filters to dashboard queries as well
                if (filters.department !== 'Todos') {
                    query = query.ilike('location', `%${filters.department}%`);
                }
                if (filters.type !== 'Todos') {
                    query = query.eq('animal_type', filters.type);
                }

                return query.order('created_at', { ascending: false }).limit(10);
            });

            try {
                // Add timeout to prevent infinite hanging on cold starts (Increased to 90s)
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Dashboard request timed out')), 90000)
                );

                const resultsPromise = Promise.all(promises);
                const results = await Promise.race([resultsPromise, timeoutPromise]) as any[];
                
                // Combine all results
                let combinedRawData: any[] = [];
                results.forEach((result: any) => {
                    if (result.data) {
                        combinedRawData = [...combinedRawData, ...result.data];
                    }
                });

                const enriched = await enrichPets(combinedRawData);
                
                // Sort combined result by date just in case, though UI separates them
                enriched.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                return { data: enriched, nextCursor: undefined }; // No next cursor for mixed dashboard
            } catch (error) {
                console.error("Dashboard fetch failed:", error);
                // Throw error to let React Query handle retry and show Error UI
                throw error;
            }

        } else {
            // FILTERED LIST MODE (Specific Category) - Standard Pagination
            const pageSize = LIST_PAGE_SIZE;
            const from = pageParam * pageSize;
            const to = from + pageSize - 1;

            let query = supabase.from('pets').select('*', { count: 'exact' });

            query = query.eq('status', filters.status);
            
            // Filter: Show only if expires_at is in the future
            query = query.gt('expires_at', nowIso);
            
            if (filters.type !== 'Todos') query = query.eq('animal_type', filters.type);
            if (filters.breed !== 'Todos') query = query.eq('breed', filters.breed);
            if (filters.size !== 'Todos') query = query.eq('size', filters.size);
            if (filters.color1 !== 'Todos') query = query.ilike('color', `%${filters.color1}%`);
            if (filters.department !== 'Todos') query = query.ilike('location', `%${filters.department}%`);
            
            query = query.order('created_at', { ascending: false }).range(from, to);

            try {
                // Explicit timeout race (Increased to 90s)
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('List request timed out')), 90000)
                );

                const queryPromise = query.then(({ data, count, error }) => {
                    if (error) throw error;
                    return { data, count };
                });

                const { data, count } = await Promise.race([queryPromise, timeoutPromise]) as any;

                const enriched = await enrichPets(data || []);
                return { data: enriched, nextCursor: (from + (data?.length || 0) < (count || 0)) ? pageParam + 1 : undefined };
            } catch (error) {
                console.error("List fetch failed:", error);
                // Throw error to let React Query handle retry
                throw error;
            }
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
        staleTime: 1000 * 60 * 1, // 1 minute stale time
        retry: 1
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