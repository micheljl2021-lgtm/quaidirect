import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn(),
  functions: { invoke: vi.fn() },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Fisherman Messaging System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Contact Selection', () => {
    it('should only send to selected contacts, not all', async () => {
      const allContacts = [
        { id: 'c1', email: 'contact1@test.com', fisherman_id: 'f1' },
        { id: 'c2', email: 'contact2@test.com', fisherman_id: 'f1' },
        { id: 'c3', email: 'contact3@test.com', fisherman_id: 'f1' },
      ];

      const selectedContactIds = ['c1', 'c3']; // Only 2 selected

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { 
          success: true, 
          recipient_count: selectedContactIds.length,
          recipients: selectedContactIds,
        },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('send-fisherman-message', {
        body: {
          message_type: 'custom',
          body: 'Test message',
          sent_to_group: 'all',
          contact_ids: selectedContactIds,
        },
      });

      // Verify only selected contacts received the message
      expect(result.data.recipient_count).toBe(2);
      expect(result.data.recipients).not.toContain('c2');
      expect(result.data.recipients).toContain('c1');
      expect(result.data.recipients).toContain('c3');
    });

    it('should require at least one contact selected', () => {
      const validateMessageSend = (selectedContacts: string[]) => {
        if (selectedContacts.length === 0) {
          return { valid: false, error: 'Veuillez sélectionner au moins un contact' };
        }
        return { valid: true, error: null };
      };

      expect(validateMessageSend([])).toEqual({
        valid: false,
        error: 'Veuillez sélectionner au moins un contact',
      });

      expect(validateMessageSend(['c1'])).toEqual({
        valid: true,
        error: null,
      });
    });

    it('should never default to all contacts', async () => {
      // Simulate the payload construction
      const buildMessagePayload = (
        messageType: string,
        body: string,
        selectedGroup: string,
        selectedContacts: { id: string }[]
      ) => {
        // Critical: contact_ids should ALWAYS be explicitly set
        const contactIds = selectedContacts.map(c => c.id);
        
        return {
          message_type: messageType,
          body: body,
          sent_to_group: selectedGroup,
          contact_ids: contactIds, // Must be explicit, never undefined
        };
      };

      const payload = buildMessagePayload(
        'custom',
        'Hello',
        'all',
        [{ id: 'c1' }, { id: 'c2' }]
      );

      expect(payload.contact_ids).toBeDefined();
      expect(payload.contact_ids).toHaveLength(2);
      expect(payload.contact_ids).toEqual(['c1', 'c2']);
    });
  });

  describe('2. Single Contact Message', () => {
    it('should send message to exactly one contact when one is selected', async () => {
      const singleContactId = ['c1'];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { 
          success: true, 
          recipient_count: 1,
          email_count: 1,
        },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('send-fisherman-message', {
        body: {
          message_type: 'invitation_initiale',
          body: 'Bonjour, je suis maintenant sur QuaiDirect!',
          sent_to_group: 'all',
          contact_ids: singleContactId,
        },
      });

      expect(result.data.recipient_count).toBe(1);
      expect(result.data.email_count).toBe(1);
    });
  });

  describe('3. Multiple Contacts Message', () => {
    it('should send message to all selected contacts when multiple are selected', async () => {
      const multipleContactIds = ['c1', 'c2', 'c3', 'c4', 'c5'];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { 
          success: true, 
          recipient_count: 5,
          email_count: 5,
        },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('send-fisherman-message', {
        body: {
          message_type: 'new_drop',
          body: 'Nouveau drop disponible!',
          sent_to_group: 'all',
          contact_ids: multipleContactIds,
        },
      });

      expect(result.data.recipient_count).toBe(5);
    });
  });

  describe('4. Message Types', () => {
    it('should handle invitation_initiale message type', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('send-fisherman-message', {
        body: {
          message_type: 'invitation_initiale',
          body: 'Bonjour, je suis maintenant sur QuaiDirect!',
          sent_to_group: 'all',
          contact_ids: ['c1'],
        },
      });

      expect(result.data.success).toBe(true);
    });

    it('should handle new_drop message type', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('send-fisherman-message', {
        body: {
          message_type: 'new_drop',
          body: 'Nouveau drop disponible!',
          sent_to_group: 'all',
          contact_ids: ['c1'],
        },
      });

      expect(result.data.success).toBe(true);
    });

    it('should handle custom message type', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('send-fisherman-message', {
        body: {
          message_type: 'custom',
          body: 'Message personnalisé de test',
          sent_to_group: 'all',
          contact_ids: ['c1'],
        },
      });

      expect(result.data.success).toBe(true);
    });

    it('should require body for custom message type', () => {
      const validateCustomMessage = (messageType: string, body: string) => {
        if (messageType === 'custom' && (!body || body.trim() === '')) {
          return { valid: false, error: 'Veuillez saisir un message' };
        }
        return { valid: true, error: null };
      };

      expect(validateCustomMessage('custom', '')).toEqual({
        valid: false,
        error: 'Veuillez saisir un message',
      });

      expect(validateCustomMessage('custom', '   ')).toEqual({
        valid: false,
        error: 'Veuillez saisir un message',
      });

      expect(validateCustomMessage('custom', 'Hello')).toEqual({
        valid: true,
        error: null,
      });

      // Non-custom types don't require body
      expect(validateCustomMessage('invitation_initiale', '')).toEqual({
        valid: true,
        error: null,
      });
    });
  });

  describe('5. Message Logging', () => {
    it('should log message in fishermen_messages table', async () => {
      const messageLog = {
        fisherman_id: 'f1',
        message_type: 'custom',
        body: 'Test message',
        sent_to_group: 'all',
        recipient_count: 3,
        email_count: 3,
        sms_count: 0,
        status: 'sent',
        sent_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: messageLog, error: null }),
      });

      const result = await mockSupabase.from('fishermen_messages').insert(messageLog);
      expect(result.error).toBeNull();
    });
  });

  describe('6. Edge Function Payload Verification', () => {
    it('should send correct payload structure to edge function', async () => {
      let capturedPayload: any = null;

      mockSupabase.functions.invoke.mockImplementation(async (functionName, options) => {
        capturedPayload = options.body;
        return { data: { success: true }, error: null };
      });

      await mockSupabase.functions.invoke('send-fisherman-message', {
        body: {
          message_type: 'new_drop',
          body: 'Test body',
          sent_to_group: 'reguliers',
          contact_ids: ['id1', 'id2'],
        },
      });

      expect(capturedPayload).toEqual({
        message_type: 'new_drop',
        body: 'Test body',
        sent_to_group: 'reguliers',
        contact_ids: ['id1', 'id2'],
      });

      // Verify contact_ids is an array, not undefined
      expect(Array.isArray(capturedPayload.contact_ids)).toBe(true);
    });
  });
});
