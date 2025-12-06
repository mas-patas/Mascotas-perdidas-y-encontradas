
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { useMemo } from 'react';
import { getLevelFromPoints, LEVELS } from '../components/GamificationBadge';

export const useGamification = (userId?: string) => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['gamificationStats', userId],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) return { reports: 0, ratings: 0, avgRating: 0 };

            // 1. Count Reports
            const { count: reports } = await supabase
                .from('pets')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);

            // 2. Get Ratings
            const { data: ratingsData } = await supabase
                .from('user_ratings')
                .select('rating')
                .eq('rated_user_id', userId);

            const ratingsCount = ratingsData?.length || 0;
            const ratingSum = ratingsData?.reduce((acc, curr) => acc + curr.rating, 0) || 0;
            const avgRating = ratingsCount > 0 ? ratingSum / ratingsCount : 0;

            return { 
                reports: reports || 0, 
                ratings: ratingsCount, 
                avgRating 
            };
        },
        staleTime: 1000 * 60 * 5 // Cache for 5 minutes
    });

    const points = useMemo(() => {
        if (!stats) return 0;
        const reportPoints = stats.reports * 15;
        const ratingCountPoints = stats.ratings * 10;
        const qualityPoints = stats.avgRating * 20;
        return Math.round(reportPoints + ratingCountPoints + qualityPoints);
    }, [stats]);

    const level = useMemo(() => getLevelFromPoints(points), [points]);
    
    const nextLevel = useMemo(() => {
        return LEVELS.find(l => l.min > level.max);
    }, [level]);

    const progress = useMemo(() => {
        if (!nextLevel) return 100;
        const range = level.max - level.min;
        const currentProgress = points - level.min;
        // Avoid division by zero if range is 0 (shouldn't happen with correct config)
        if (range <= 0) return 100;
        return Math.min(100, Math.max(0, (currentProgress / range) * 100));
    }, [points, level, nextLevel]);

    return {
        points,
        level,
        nextLevel,
        progress,
        isLoading
    };
};
