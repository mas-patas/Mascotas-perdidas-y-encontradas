
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { USER_ROLES, SUPPORT_TICKET_STATUS } from '../constants';
import type { Report, SupportTicket, BannedIP } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const useAdminData = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const isAdmin = currentUser?.role === USER_ROLES.ADMIN || currentUser?.role === USER_ROLES.SUPERADMIN;

    // Realtime for Support Tickets (Admin + User)
    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel('support-realtime')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'support_tickets' },
                (payload) => {
                    // Update for user
                    if (payload.new.user_email === currentUser.email) {
                        queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
                        if (payload.new.status !== payload.old.status) {
                            showToast(`Tu ticket ha cambiado a estado: ${payload.new.status}`, 'info');
                        }
                    }
                    // Update for admin
                    if (isAdmin) {
                        queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
                    }
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser, isAdmin, queryClient, showToast]);

    const reportsQuery = useQuery({
        queryKey: ['reports', currentUser?.id],
        enabled: !!currentUser,
        queryFn: async () => {
            let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
            if (!isAdmin) {
                query = query.eq('reporter_email', currentUser!.email);
            }
            const { data } = await query;
            if (!data) return [];
            return data.map((r: any) => ({
                id: r.id,
                reporterEmail: r.reporter_email,
                reportedEmail: r.reported_email,
                type: r.type,
                targetId: r.target_id,
                reason: r.reason,
                details: r.details,
                status: r.status,
                timestamp: r.created_at,
                postSnapshot: r.post_snapshot
            })) as Report[];
        }
    });

    const ticketsQuery = useQuery({
        queryKey: ['supportTickets', currentUser?.id],
        enabled: !!currentUser,
        queryFn: async () => {
            let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
            if (!isAdmin) {
                query = query.eq('user_email', currentUser!.email);
            }
            const { data } = await query;
            if (!data) return [];
            return data.map((t: any) => ({
                id: t.id,
                userEmail: t.user_email,
                category: t.category,
                subject: t.subject,
                description: t.description,
                status: t.status,
                assignedTo: t.assigned_to,
                response: t.response,
                assignmentHistory: t.assignment_history || [],
                timestamp: t.created_at,
                relatedReportId: t.related_report_id 
            })) as SupportTicket[];
        }
    });

    return {
        reports: reportsQuery.data || [],
        isLoadingReports: reportsQuery.isLoading,
        supportTickets: ticketsQuery.data || [],
        isLoadingTickets: ticketsQuery.isLoading,
        refetchReports: reportsQuery.refetch,
        refetchTickets: ticketsQuery.refetch
    };
};

export const useBannedIps = () => {
    return useQuery({
        queryKey: ['bannedIps'],
        queryFn: async () => {
            const { data } = await supabase.from('banned_ips').select('*').order('created_at', { ascending: false });
            if (!data) return [];
            return data.map((b: any) => ({
                id: b.id,
                ipAddress: b.ip_address,
                reason: b.reason,
                createdAt: b.created_at
            })) as BannedIP[];
        },
        // Check frequently or on mount
        staleTime: 1000 * 60 * 2, 
    });
};
