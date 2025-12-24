import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, Users, Loader2, Search, CheckCircle2, Info } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface ContactSelectorProps {
  fishermanId: string;
  selectedGroup: string;
  onSelectedContactsChange: (contacts: any[]) => void;
  selectedDropId?: string;
  excludeAutoNotified?: boolean;
}

export const ContactSelector = ({ 
  fishermanId, 
  selectedGroup, 
  onSelectedContactsChange,
  selectedDropId,
  excludeAutoNotified = true
}: ContactSelectorProps) => {
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [filterGroup, setFilterGroup] = useState<string>(selectedGroup);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['fisherman-contacts', fishermanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishermen_contacts')
        .select('*')
        .eq('fisherman_id', fishermanId)
        .order('last_name', { ascending: true })
        .range(0, 4999);

      if (error) throw error;
      return data;
    },
    enabled: !!fishermanId,
  });

  // Fetch auto-notified users for this drop
  const { data: autoNotifiedData } = useQuery({
    queryKey: ['drop-notifications-sent', selectedDropId],
    queryFn: async () => {
      if (!selectedDropId) return { emails: new Set<string>(), count: 0 };
      
      const { data, error } = await supabase
        .from('drop_notifications_sent')
        .select('email, user_id, notification_source')
        .eq('drop_id', selectedDropId);

      if (error) {
        console.error('Error fetching auto notifications:', error);
        return { emails: new Set<string>(), count: 0 };
      }

      const emails = new Set(data?.filter(n => n.email).map(n => n.email!.toLowerCase()) || []);
      return { 
        emails, 
        count: data?.length || 0,
        sources: data?.reduce((acc, n) => {
          if (!acc[n.notification_source]) acc[n.notification_source] = 0;
          acc[n.notification_source]++;
          return acc;
        }, {} as Record<string, number>)
      };
    },
    enabled: !!selectedDropId,
  });

  const autoNotifiedEmails = autoNotifiedData?.emails || new Set<string>();
  const autoNotifiedCount = autoNotifiedData?.count || 0;

  // Get unique contact groups
  const contactGroups = contacts
    ? Array.from(new Set(contacts.map(c => c.contact_group).filter(Boolean)))
    : [];

  // Filter contacts based on selected group and search query
  const filteredContacts = useMemo(() => {
    let result = contacts || [];
    
    // Filter by group
    if (filterGroup !== 'all') {
      if (filterGroup === 'general') {
        result = result.filter(contact => !contact.contact_group);
      } else {
        result = result.filter(contact => contact.contact_group === filterGroup);
      }
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(contact => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        const email = (contact.email || '').toLowerCase();
        const phone = (contact.phone || '').toLowerCase();
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
      });
    }
    
    return result;
  }, [contacts, filterGroup, searchQuery]);

  // Check if a contact was auto-notified
  const isAutoNotified = (contact: any) => {
    if (!contact.email) return false;
    return autoNotifiedEmails.has(contact.email.toLowerCase());
  };

  // Count auto-notified contacts in current filtered list
  const autoNotifiedInList = filteredContacts.filter(isAutoNotified).length;

  // Contacts that can be selected (not auto-notified if excludeAutoNotified is true)
  const selectableContacts = useMemo(() => {
    if (!excludeAutoNotified || !selectedDropId) return filteredContacts;
    return filteredContacts.filter(c => !isAutoNotified(c));
  }, [filteredContacts, excludeAutoNotified, selectedDropId, autoNotifiedEmails]);

  // Update parent component when selection changes
  useEffect(() => {
    const selectedContacts = selectableContacts.filter(c => selectedContactIds.has(c.id));
    onSelectedContactsChange(selectedContacts);
  }, [selectedContactIds, selectableContacts, onSelectedContactsChange]);

  // Reset selection when drop changes
  useEffect(() => {
    setSelectedContactIds(new Set());
  }, [selectedDropId]);

  const handleToggleContact = (contactId: string) => {
    const contact = filteredContacts.find(c => c.id === contactId);
    if (contact && isAutoNotified(contact) && excludeAutoNotified) {
      return; // Don't allow selecting auto-notified contacts
    }
    
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedContactIds.size === selectableContacts.length && selectableContacts.length > 0) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(selectableContacts.map(c => c.id)));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Chargement des contacts...</p>
        </CardContent>
      </Card>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Aucun contact
          </CardTitle>
          <CardDescription>
            Importez vos contacts depuis la page "Carnet de clients" pour envoyer des messages
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sélectionner les contacts ({selectedContactIds.size}/{selectableContacts.length})
            </CardTitle>
            <CardDescription>
              Choisissez les destinataires de votre message
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-notified info banner */}
        {selectedDropId && autoNotifiedCount > 0 && (
          <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-200">
              <strong>{autoNotifiedCount} client{autoNotifiedCount > 1 ? 's' : ''}</strong> {autoNotifiedCount > 1 ? 'ont' : 'a'} déjà reçu une notification automatique pour cet arrivage
              {autoNotifiedInList > 0 && excludeAutoNotified && (
                <span className="block text-sm mt-1 text-emerald-600 dark:text-emerald-400">
                  {autoNotifiedInList} affiché{autoNotifiedInList > 1 ? 's' : ''} ci-dessous (non sélectionnable{autoNotifiedInList > 1 ? 's' : ''})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter by group */}
        <div className="space-y-2">
          <Label>Filtrer par groupe</Label>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les contacts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les contacts</SelectItem>
              <SelectItem value="general">Groupe général (sans groupe)</SelectItem>
              {contactGroups.map(group => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Select all toggle */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={selectedContactIds.size === selectableContacts.length && selectableContacts.length > 0}
            onCheckedChange={handleToggleAll}
          />
          <Label htmlFor="select-all" className="cursor-pointer font-semibold">
            Tout sélectionner ({selectableContacts.length})
          </Label>
        </div>

        {/* Contact list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredContacts.map(contact => {
            const autoNotified = isAutoNotified(contact);
            const isDisabled = autoNotified && excludeAutoNotified;
            
            return (
              <div
                key={contact.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  autoNotified 
                    ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' 
                    : 'hover:bg-muted/50'
                } ${isDisabled ? 'opacity-75' : ''}`}
              >
                <Checkbox
                  id={`contact-${contact.id}`}
                  checked={selectedContactIds.has(contact.id)}
                  onCheckedChange={() => handleToggleContact(contact.id)}
                  disabled={isDisabled}
                />
                <Label
                  htmlFor={`contact-${contact.id}`}
                  className={`flex-1 space-y-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                    {contact.contact_group && (
                      <Badge variant="outline" className="text-xs">
                        {contact.contact_group}
                      </Badge>
                    )}
                    {autoNotified && (
                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Notifié auto
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
