import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mail, Phone, Users, Loader2, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface ContactSelectorProps {
  fishermanId: string;
  selectedGroup: string;
  onSelectedContactsChange: (contacts: any[]) => void;
}

export const ContactSelector = ({ fishermanId, selectedGroup, onSelectedContactsChange }: ContactSelectorProps) => {
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

  // Update parent component when selection changes
  useEffect(() => {
    const selectedContacts = filteredContacts.filter(c => selectedContactIds.has(c.id));
    onSelectedContactsChange(selectedContacts);
  }, [selectedContactIds, filteredContacts]);

  const handleToggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map(c => c.id)));
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
              Sélectionner les contacts ({selectedContactIds.size}/{filteredContacts.length})
            </CardTitle>
            <CardDescription>
              Choisissez les destinataires de votre message
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
            checked={selectedContactIds.size === filteredContacts.length && filteredContacts.length > 0}
            onCheckedChange={handleToggleAll}
          />
          <Label htmlFor="select-all" className="cursor-pointer font-semibold">
            Tout sélectionner ({filteredContacts.length})
          </Label>
        </div>

        {/* Contact list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredContacts.map(contact => (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`contact-${contact.id}`}
                checked={selectedContactIds.has(contact.id)}
                onCheckedChange={() => handleToggleContact(contact.id)}
              />
              <Label
                htmlFor={`contact-${contact.id}`}
                className="flex-1 cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </span>
                  {contact.contact_group && (
                    <Badge variant="outline" className="text-xs">
                      {contact.contact_group}
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};