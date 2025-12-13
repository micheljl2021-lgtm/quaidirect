import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SmsMessage, SmsHistoryFilters, SmsHistoryResponse } from '@/types/sms-analytics';

/**
 * Hook to fetch SMS history with filters and pagination
 */
export function useSmsHistory(fishermanId: string | null, filters: SmsHistoryFilters = {}) {
  const {
    status = 'all',
    type = 'all',
    phone,
    search,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 50,
  } = filters;

  return useQuery({
    queryKey: ['sms-history', fishermanId, status, type, phone, search, dateFrom, dateTo, page, pageSize],
    queryFn: async (): Promise<SmsHistoryResponse> => {
      if (!fishermanId) {
        return {
          messages: [],
          total: 0,
          page: 1,
          pageSize,
          totalPages: 0,
        };
      }

      // Build query
      let query = supabase
        .from('sms_messages')
        .select('*', { count: 'exact' })
        .eq('fisherman_id', fishermanId);

      // Apply filters
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (type !== 'all') {
        query = query.eq('type', type);
      }

      if (phone) {
        query = query.ilike('contact_phone', `%${phone}%`);
      }

      if (search) {
        query = query.ilike('message', `%${search}%`);
      }

      if (dateFrom) {
        query = query.gte('sent_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('sent_at', dateTo);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query
        .order('sent_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching SMS history:', error);
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        messages: (data || []) as SmsMessage[],
        total,
        page,
        pageSize,
        totalPages,
      };
    },
    enabled: !!fishermanId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to fetch SMS history for admin (all fishermen)
 */
export function useAdminSmsHistory(filters: SmsHistoryFilters = {}) {
  const {
    fishermanId,
    status = 'all',
    type = 'all',
    phone,
    search,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 50,
  } = filters;

  return useQuery({
    queryKey: ['admin-sms-history', fishermanId, status, type, phone, search, dateFrom, dateTo, page, pageSize],
    queryFn: async (): Promise<SmsHistoryResponse> => {
      // Build query
      let query = supabase
        .from('sms_messages')
        .select('*, fishermen(boat_name)', { count: 'exact' });

      // Apply filters
      if (fishermanId) {
        query = query.eq('fisherman_id', fishermanId);
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (type !== 'all') {
        query = query.eq('type', type);
      }

      if (phone) {
        query = query.ilike('contact_phone', `%${phone}%`);
      }

      if (search) {
        query = query.ilike('message', `%${search}%`);
      }

      if (dateFrom) {
        query = query.gte('sent_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('sent_at', dateTo);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query
        .order('sent_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching admin SMS history:', error);
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        messages: (data || []) as any[],
        total,
        page,
        pageSize,
        totalPages,
      };
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
