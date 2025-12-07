import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { supabase } from '../services/supabaseClient';
import { PET_STATUS, ANIMAL_TYPES } from '../constants';

/**
 * Query hook to fetch admin statistics
 */
export const useAdminStats = (dateRangeFilter: '7d' | '30d' | '1y' | 'all') => {
  return useQuery({
    queryKey: ['adminStats', dateRangeFilter],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      
      if (dateRangeFilter === '7d') startDate.setDate(now.getDate() - 7);
      else if (dateRangeFilter === '30d') startDate.setDate(now.getDate() - 30);
      else if (dateRangeFilter === '1y') startDate.setFullYear(now.getFullYear() - 1);
      else startDate = new Date(0);

      const startDateIso = startDate.toISOString();

      const [
        { count: totalPets },
        { count: totalUsers },
        { count: totalReports },
        { count: pendingTickets },
        { count: totalCampaigns },
        { data: recentPetsData }
      ] = await Promise.all([
        supabase.from('pets').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'Pendiente'),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }),
        supabase.from('pets').select('created_at, status, animal_type').gte('created_at', startDateIso)
      ]);

      // Process Chart Data
      const chartMap = new Map<string, number>();
      const isYearly = dateRangeFilter === '1y' || dateRangeFilter === 'all';
      
      if (isYearly) {
        for (let i = 0; i < 12; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          chartMap.set(key, 0);
        }
      } else {
        const days = dateRangeFilter === '7d' ? 7 : 30;
        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const key = d.toISOString().split('T')[0];
          chartMap.set(key, 0);
        }
      }

      recentPetsData?.forEach((p: any) => {
        const d = new Date(p.created_at);
        let key = '';
        if (isYearly) key = `${d.getFullYear()}-${d.getMonth()}`;
        else key = d.toISOString().split('T')[0];
        
        if (chartMap.has(key)) {
          chartMap.set(key, (chartMap.get(key) || 0) + 1);
        }
      });

      const chartData = Array.from(chartMap.entries()).map(([key, value]) => {
        let label = '';
        if (isYearly) {
          const [y, m] = key.split('-');
          const d = new Date(parseInt(y), parseInt(m));
          label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        } else {
          const d = new Date(key);
          label = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }
        return { label, value, key };
      }).reverse();

      // Status Distribution
      const { data: distributionData } = await supabase.from('pets').select('status, animal_type');
      
      const petsByStatus = {
        lost: distributionData?.filter((p: any) => p.status === PET_STATUS.PERDIDO).length || 0,
        found: distributionData?.filter((p: any) => p.status === PET_STATUS.ENCONTRADO).length || 0,
        sighted: distributionData?.filter((p: any) => p.status === PET_STATUS.AVISTADO).length || 0,
      };

      const petsByType = {
        dogs: distributionData?.filter((p: any) => p.animal_type === ANIMAL_TYPES.PERRO).length || 0,
        cats: distributionData?.filter((p: any) => p.animal_type === ANIMAL_TYPES.GATO).length || 0,
        other: distributionData?.filter((p: any) => p.animal_type === ANIMAL_TYPES.OTRO).length || 0,
      };

      return {
        totalPets: totalPets || 0,
        totalUsers: totalUsers || 0,
        totalReports: totalReports || 0,
        pendingTickets: pendingTickets || 0,
        totalCampaigns: totalCampaigns || 0,
        chartData,
        petsByStatus,
        petsByType
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
