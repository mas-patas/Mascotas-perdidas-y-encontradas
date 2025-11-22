
import { useState, useEffect, useCallback, useRef } from 'react';
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

export const usePets = ({ filters }: UsePetsProps) => {
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(0);
    
    // Keep track of subscriptions to clean up
    const subscriptionRef = useRef<any>(null);

    // Helper to fetch enrichment data (owner email, comments, likes)
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
                comments: petComments
            };
        });
    };

    const fetchPets = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) setLoading(true);
        
        try {
            if (filters.status === 'Todos') {
                // DASHBOARD MODE
                if (isLoadMore) {
                    setLoading(false);
                    return; 
                }

                const categories = [PET_STATUS.PERDIDO, PET_STATUS.ENCONTRADO, PET_STATUS.AVISTADO, PET_STATUS.EN_ADOPCION, PET_STATUS.REUNIDO];
                const promises = categories.map(status => 
                    supabase.from('pets')
                        .select('*')
                        .eq('status', status)
                        .order('created_at', { ascending: false })
                        .limit(8)
                );
                
                const results = await Promise.all(promises);
                const rawPets = results.flatMap(r => r.data || []);
                
                const uniqueRawPets = Array.from(new Map(rawPets.map(item => [item['id'], item])).values());
                
                const enriched = await enrichPets(uniqueRawPets);
                
                enriched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                setPets(enriched);
                setHasMore(false); 
                setPage(0);

            } else {
                // FILTERED LIST MODE
                const targetPage = isLoadMore ? page + 1 : 0;
                const from = targetPage * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;

                let query = supabase.from('pets').select('*', { count: 'exact' });

                // Apply Filters
                query = query.eq('status', filters.status);
                
                if (filters.type !== 'Todos') query = query.eq('animal_type', filters.type);
                if (filters.breed !== 'Todos') query = query.eq('breed', filters.breed);
                if (filters.size !== 'Todos') query = query.eq('size', filters.size);
                if (filters.color1 !== 'Todos') query = query.ilike('color', `%${filters.color1}%`);
                
                query = query.order('created_at', { ascending: false }).range(from, to);

                const { data, count, error } = await query;
                if (error) throw error;

                const enriched = await enrichPets(data || []);
                
                if (isLoadMore) {
                    setPets(prev => {
                        const newIds = new Set(enriched.map(p => p.id));
                        return [...prev, ...enriched.filter(p => !newIds.has(p.id))];
                    });
                } else {
                    setPets(enriched);
                }

                setPage(targetPage);
                setHasMore(count !== null && (from + (data?.length || 0)) < count);
            }

        } catch (err) {
            console.error("Error fetching pets:", err);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    // Trigger fetch when filters change
    useEffect(() => {
        fetchPets(false);
    }, [
        filters.status, 
        filters.type, 
        filters.breed, 
        filters.size, 
        filters.color1,
    ]);

    // Realtime Subscription
    useEffect(() => {
        if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);

        const channel = supabase.channel('pets-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pets' },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newPetRaw = payload.new as any;
                        const matchStatus = filters.status === 'Todos' || filters.status === newPetRaw.status;
                        const matchType = filters.type === 'Todos' || filters.type === newPetRaw.animal_type;
                        
                        if (matchStatus && matchType) {
                            const [enriched] = await enrichPets([newPetRaw]);
                            setPets(prev => [enriched, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as any;
                        // Re-fetch enrichment to be safe with related data
                        const [enriched] = await enrichPets([updated]);
                        if(enriched) {
                            setPets(prev => prev.map(p => p.id === enriched.id ? enriched : p));
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setPets(prev => prev.filter(p => p.id !== payload.old.id));
                    }
                }
            )
            // Note: Subscribing to comments table directly here to update comments list in real-time
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments' },
                (payload) => {
                    const newCommentRaw = payload.new as any;
                    const newComment: Comment = {
                        id: newCommentRaw.id,
                        userEmail: newCommentRaw.user_email,
                        userName: newCommentRaw.user_name,
                        text: newCommentRaw.text,
                        timestamp: newCommentRaw.created_at,
                        parentId: newCommentRaw.parent_id, // Map parent_id
                        likes: []
                    };
                    
                    setPets(prev => prev.map(p => {
                        if (p.id === newCommentRaw.pet_id) {
                            // Avoid duplicate if we added it optimistically
                            if (p.comments?.some(c => c.id === newComment.id)) return p;
                            return {
                                ...p,
                                comments: [...(p.comments || []), newComment]
                            };
                        }
                        return p;
                    }));
                }
            )
            .subscribe();

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
        };
    }, [filters.status, filters.type]);

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchPets(true);
        }
    };

    return { pets, setPets, loading, hasMore, loadMore };
};
