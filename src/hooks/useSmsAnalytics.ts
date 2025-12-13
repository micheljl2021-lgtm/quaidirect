import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SmsMessage, SmsAnalytics, TimeRange, TopFisherman, SmsMessageWithFisherman } from '@/types/sms-analytics';
import { calculateAnalytics, getDateRangeForTimeRange } from '@/lib/sms-analytics';

/**
 * Hook to fetch SMS analytics for a fisherman
 */
export function useSmsAnalytics(fishermanId: string | null, timeRange: TimeRange = '30d') {
  return useQuery({
    queryKey: ['sms-analytics', fishermanId, timeRange],
    queryFn: async (): Promise<SmsAnalytics> => {
      if (!fishermanId) {
        throw new Error('Fisherman ID is required');
      }

      const { from, to } = getDateRangeForTimeRange(timeRange);

      // Fetch SMS messages for the time range
      let query = supabase
        .from('sms_messages')
        .select('*')
        .eq('fisherman_id', fishermanId)
        .order('sent_at', { ascending: false });

      if (timeRange !== 'all') {
        query = query
          .gte('sent_at', from.toISOString())
          .lte('sent_at', to.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching SMS analytics:', error);
        throw error;
      }

      const messages = (data || []) as SmsMessage[];
      const analytics = calculateAnalytics(messages);

      return {
        ...analytics,
        lastUpdated: new Date(),
      };
    },
    enabled: !!fishermanId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch SMS analytics for admin (all fishermen)
 */
export function useAdminSmsAnalytics(timeRange: TimeRange = '30d') {
  return useQuery({
    queryKey: ['admin-sms-analytics', timeRange],
    queryFn: async (): Promise<SmsAnalytics> => {
      const { from, to } = getDateRangeForTimeRange(timeRange);

      // Fetch all SMS messages for the time range
      let query = supabase
        .from('sms_messages')
        .select('*, fishermen(id, boat_name)')
        .order('sent_at', { ascending: false });

      if (timeRange !== 'all') {
        query = query
          .gte('sent_at', from.toISOString())
          .lte('sent_at', to.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching admin SMS analytics:', error);
        throw error;
      }

      const messages = (data || []) as SmsMessageWithFisherman[];
      const analytics = calculateAnalytics(messages);

      // Calculate top fishermen by SMS volume
      const fishermenMap = new Map<string, { boat_name: string; count: number }>();
      messages.forEach(m => {
        if (m.fishermen) {
          const existing = fishermenMap.get(m.fisherman_id) || { 
            boat_name: m.fishermen.boat_name, 
            count: 0 
          };
          fishermenMap.set(m.fisherman_id, {
            boat_name: existing.boat_name,
            count: existing.count + 1,
          });
        }
      });

      const topFishermen: TopFisherman[] = Array.from(fishermenMap.entries())
        .map(([fisherman_id, stats]) => ({
          fisherman_id,
          boat_name: stats.boat_name,
          count: stats.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        ...analytics,
        topFishermen,
        lastUpdated: new Date(),
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
