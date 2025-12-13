/**
 * Type definitions for SMS functionality
 */

export type SmsType = 'invitation' | 'notification' | 'custom';

export type SmsStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export interface SmsMessage {
  id: string;
  fisherman_id: string;
  contact_id?: string;
  phone: string;
  message: string;
  type: SmsType;
  status: SmsStatus;
  twilio_sid?: string;
  error?: string;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
}

export interface SmsTemplate {
  id: string;
  fisherman_id: string;
  type: SmsType;
  name: string;
  body: string;
  variables: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendSmsRequest {
  phones: string[];
  message: string;
  type: SmsType;
  contact_ids?: string[];
}

export interface SendSmsResponse {
  success: boolean;
  sent: number;
  failed: number;
  results: Array<{
    phone: string;
    success: boolean;
    sid?: string;
    error?: string;
  }>;
  quota: {
    free_remaining: number;
    paid_balance: number;
    total_available: number;
  };
}

export interface SmsQuota {
  free_remaining: number;
  paid_balance: number;
  total_available: number;
  free_quota: number;
  free_used: number;
}

export interface SmsInvitationRequest {
  contact_ids: string[];
  template_id?: string;
  custom_message?: string;
}

export interface SmsNotificationRequest {
  drop_id: string;
  contact_ids?: string[];
  template_id?: string;
  custom_message?: string;
}
