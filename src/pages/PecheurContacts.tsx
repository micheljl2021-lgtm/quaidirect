import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Plus, Trash2, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PecheurContacts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [csvContent, setCsvContent] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualContact, setManualContact] = useState({
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
    contact_group: "general",
    notes: ""
  });

  // Récupérer le fisherman_id
  const { data: fisherman } = useQuery({
    queryKey: ['fisherman-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Récupérer tous les contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['fisherman-contacts', fisherman?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishermen_contacts')
        .select('*')
        .eq('fisherman_id', fisherman?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!fisherman?.id
  });

  // Import CSV
  const importCSV = useMutation({
    mutationFn: async (csvText: string) => {
      const lines = csvText.trim().split('\n');
      const contactsToImport = [];

      for (let i = 1; i < lines.length; i++) {
        const [email, phone, first_name, last_name, contact_group] = lines[i].split(',').map(s => s.trim());
        if (email || phone) {
          contactsToImport.push({
            fisherman_id: fisherman?.id,
            email: email || null,
            phone: phone || null,
            first_name: first_name || null,
            last_name: last_name || null,
            contact_group: contact_group || 'general'
          });
        }
      }

      const { error } = await supabase
        .from('fishermen_contacts')
        .insert(contactsToImport);

      if (error) throw error;
      return contactsToImport.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} contacts importés avec succès`);
      setCsvContent("");
      queryClient.invalidateQueries({ queryKey: ['fisherman-contacts'] });
    },
    onError: () => {
      toast.error("Erreur lors de l'import des contacts");
    }
  });

  // Ajout manuel
  const addManualContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('fishermen_contacts')
        .insert({
          fisherman_id: fisherman?.id,
          ...manualContact
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact ajouté avec succès");
      setManualContact({
        email: "",
        phone: "",
        first_name: "",
        last_name: "",
        contact_group: "general",
        notes: ""
      });
      setShowManualForm(false);
      queryClient.invalidateQueries({ queryKey: ['fisherman-contacts'] });
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout du contact");
    }
  });

  // Suppression
  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('fishermen_contacts')
        .delete()
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact supprimé");
      queryClient.invalidateQueries({ queryKey: ['fisherman-contacts'] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes Contacts Clients</h1>
        <p className="text-muted-foreground">
          Gérez votre base de contacts pour envoyer des messages groupés
        </p>
      </div>

      <div className="grid gap-6 mb-6">
        {/* Import CSV */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importer des contacts (CSV)
            </CardTitle>
            <CardDescription>
              Format: email, phone, first_name, last_name, contact_group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="email,phone,first_name,last_name,contact_group&#10;client@example.com,0612345678,Jean,Dupont,reguliers"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              rows={6}
              className="mb-4"
            />
            <Button 
              onClick={() => importCSV.mutate(csvContent)}
              disabled={!csvContent.trim() || importCSV.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer les contacts
            </Button>
          </CardContent>
        </Card>

        {/* Ajout manuel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter un contact manuellement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showManualForm ? (
              <Button onClick={() => setShowManualForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau contact
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={manualContact.email}
                      onChange={(e) => setManualContact({...manualContact, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={manualContact.phone}
                      onChange={(e) => setManualContact({...manualContact, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={manualContact.first_name}
                      onChange={(e) => setManualContact({...manualContact, first_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={manualContact.last_name}
                      onChange={(e) => setManualContact({...manualContact, last_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Groupe</Label>
                    <Input
                      value={manualContact.contact_group}
                      onChange={(e) => setManualContact({...manualContact, contact_group: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={manualContact.notes}
                      onChange={(e) => setManualContact({...manualContact, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => addManualContact.mutate()}
                    disabled={(!manualContact.email && !manualContact.phone) || addManualContact.isPending}
                  >
                    Ajouter
                  </Button>
                  <Button variant="outline" onClick={() => setShowManualForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mes contacts ({contacts?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Chargement...</p>
            ) : contacts && contacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Groupe</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        {contact.first_name} {contact.last_name}
                      </TableCell>
                      <TableCell>{contact.email || '-'}</TableCell>
                      <TableCell>{contact.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.contact_group}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContact.mutate(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Aucun contact pour le moment</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PecheurContacts;
