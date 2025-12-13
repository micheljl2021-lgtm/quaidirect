// Types for SMS Analytics Dashboard

export interface SmsMessage {
  id: string;
  fisherman_id: string;
  contact_phone: string;
  message: string;
  type: 'invitation' | 'notification' | 'promotion';
  status: 'sent' | 'failed' | 'pending' | 'delivered';
  sent_at: string | null;
  delivered_at: string | null;
  error_message?: string | null;
  twilio_sid?: string | null;
  retries: number;
  cost_cents: number;
  drop_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmsAnalytics {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  totalDelivered: number;
  successRate: number;
  totalCost: number;
  byType: { type: string; count: number; cost: number }[];
  byStatus: { status: string; count: number }[];
  dailyStats: { date: string; count: number; cost: number }[];
  topFishermen?: { fisherman_id: string; boat_name: string; count: number }[];
  lastUpdated: Date;
}

export interface SmsHistoryFilters {
  fishermanId?: string;
  status?: 'sent' | 'failed' | 'pending' | 'delivered' | 'all';
  type?: 'invitation' | 'notification' | 'promotion' | 'all';
  phone?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface SmsHistoryResponse {
  messages: SmsMessage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type TimeRange = '24h' | '7d' | '30d' | 'all';
