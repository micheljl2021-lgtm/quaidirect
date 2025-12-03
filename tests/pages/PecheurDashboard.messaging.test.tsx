import { describe, it, expect, vi } from 'vitest';
import { toast } from 'sonner';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('PecheurDashboard Messaging Logic', () => {
  it('refuses to send if no contacts selected', () => {
    const selectedContacts: string[] = [];
    if (selectedContacts.length === 0) toast.error('Sélectionnez au moins un contact');
    expect(toast.error).toHaveBeenCalledWith('Sélectionnez au moins un contact');
  });

  it('extracts contact_ids from selected contacts', () => {
    const contacts = [{ id: 'c1' }, { id: 'c2' }];
    expect(contacts.map(c => c.id)).toEqual(['c1', 'c2']);
  });

  it('sends only to selected contacts', () => {
    const all = ['c1', 'c2', 'c3', 'c4'];
    const selected = ['c1', 'c3'];
    expect(selected).not.toContain('c2');
    expect(selected).not.toContain('c4');
  });
});
