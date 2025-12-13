// Utility functions for SMS Analytics

import { SmsMessage, SmsAnalytics, TimeRange } from '@/types/sms-analytics';

/**
 * Calculate analytics from SMS messages
 */
export function calculateAnalytics(messages: SmsMessage[]): Omit<SmsAnalytics, 'lastUpdated'> {
  const totalSent = messages.filter(m => m.status === 'sent' || m.status === 'delivered').length;
  const totalFailed = messages.filter(m => m.status === 'failed').length;
  const totalPending = messages.filter(m => m.status === 'pending').length;
  const totalDelivered = messages.filter(m => m.status === 'delivered').length;
  
  const successRate = messages.length > 0 
    ? ((totalSent + totalDelivered) / messages.length) * 100 
    : 0;
  
  const totalCost = messages.reduce((sum, m) => {
    if (m.status === 'sent' || m.status === 'delivered') {
      return sum + (m.cost_cents / 100);
    }
    return sum;
  }, 0);

  // Calculate by type
  const typeMap = new Map<string, { count: number; cost: number }>();
  messages.forEach(m => {
    const existing = typeMap.get(m.type) || { count: 0, cost: 0 };
    typeMap.set(m.type, {
      count: existing.count + 1,
      cost: existing.cost + ((m.status === 'sent' || m.status === 'delivered') ? m.cost_cents / 100 : 0),
    });
  });
  const byType = Array.from(typeMap.entries()).map(([type, stats]) => ({
    type,
    count: stats.count,
    cost: stats.cost,
  }));

  // Calculate by status
  const statusMap = new Map<string, number>();
  messages.forEach(m => {
    statusMap.set(m.status, (statusMap.get(m.status) || 0) + 1);
  });
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  // Calculate daily stats (last 30 days)
  const dailyMap = new Map<string, { count: number; cost: number }>();
  messages.forEach(m => {
    if (m.sent_at) {
      const date = m.sent_at.split('T')[0];
      const existing = dailyMap.get(date) || { count: 0, cost: 0 };
      dailyMap.set(date, {
        count: existing.count + 1,
        cost: existing.cost + ((m.status === 'sent' || m.status === 'delivered') ? m.cost_cents / 100 : 0),
      });
    }
  });
  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ date, count: stats.count, cost: stats.cost }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalSent,
    totalFailed,
    totalPending,
    totalDelivered,
    successRate,
    totalCost,
    byType,
    byStatus,
    dailyStats,
  };
}

/**
 * Get date range for time filter
 */
export function getDateRangeForTimeRange(range: TimeRange): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  switch (range) {
    case '24h':
      from.setDate(from.getDate() - 1);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case 'all':
      from.setFullYear(from.getFullYear() - 10); // 10 years ago
      break;
  }

  return { from, to };
}

/**
 * Format cost in euros
 */
export function formatCost(cents: number): string {
  return `${(cents / 100).toFixed(2)}€`;
}

/**
 * Format success rate percentage
 */
export function formatSuccessRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered':
    case 'sent':
      return '#10b981'; // green
    case 'failed':
      return '#ef4444'; // red
    case 'pending':
      return '#eab308'; // yellow
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'delivered':
      return '📨 Livré';
    case 'sent':
      return '✅ Envoyé';
    case 'failed':
      return '❌ Échec';
    case 'pending':
      return '⏳ En attente';
    default:
      return status;
  }
}

/**
 * Get type label
 */
export function getTypeLabel(type: string): string {
  switch (type) {
    case 'invitation':
      return 'Invitation';
    case 'notification':
      return 'Notification';
    case 'promotion':
      return 'Promotion';
    default:
      return type;
  }
}

/**
 * Export SMS data to CSV format
 */
export function exportToCSV(messages: SmsMessage[]): string {
  const headers = [
    'Date',
    'Téléphone',
    'Message',
    'Type',
    'Statut',
    'Coût (€)',
    'Réessais',
    'Livré le',
    'Erreur',
  ];

  const rows = messages.map(m => [
    m.sent_at ? new Date(m.sent_at).toLocaleString('fr-FR') : '-',
    m.contact_phone,
    m.message.replace(/"/g, '""'), // Escape quotes
    getTypeLabel(m.type),
    getStatusLabel(m.status),
    (m.cost_cents / 100).toFixed(2),
    m.retries.toString(),
    m.delivered_at ? new Date(m.delivered_at).toLocaleString('fr-FR') : '-',
    m.error_message || '-',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}
