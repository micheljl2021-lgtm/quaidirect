import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Plus, Trash2, Users, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import { getUserFriendlyError } from "@/lib/errorMessages";
import { 
  parseCSVContacts, 
  exportContactsToCSV, 
  validateEmail, 
  validateFrenchPhone,
  type ParsedContact 
} from "@/lib/validators";

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Parse CSV preview
  const csvPreview = useMemo(() => {
    if (!csvContent.trim()) return null;
    return parseCSVContacts(csvContent);
  }, [csvContent]);

  // Import CSV
  const importCSV = useMutation({
    mutationFn: async () => {
      if (!csvPreview) throw new Error('Aucun contenu à importer');
      
      const validContacts = csvPreview.contacts.filter(c => c.isValid);
      if (validContacts.length === 0) {
        throw new Error('Aucun contact valide à importer');
      }

      const contactsToImport = validContacts.map(c => ({
        fisherman_id: fisherman?.id,
        email: c.email,
        phone: c.phone,
        first_name: c.first_name,
        last_name: c.last_name,
        contact_group: c.contact_group
      }));

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
    onError: (error) => {
      toast.error(getUserFriendlyError(error));
    }
  });

  // Validate manual form
  const validateManualForm = () => {
    const errors: Record<string, string> = {};
    
    if (!manualContact.email && !manualContact.phone) {
      errors.email = 'Email ou téléphone requis';
      errors.phone = 'Email ou téléphone requis';
    }
    
    if (manualContact.email) {
      const emailResult = validateEmail(manualContact.email);
      if (!emailResult.isValid) {
        errors.email = emailResult.error || 'Email invalide';
      }
    }
    
    if (manualContact.phone) {
      const phoneResult = validateFrenchPhone(manualContact.phone);
      if (!phoneResult.isValid) {
        errors.phone = phoneResult.error || 'Téléphone invalide';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Ajout manuel
  const addManualContact = useMutation({
    mutationFn: async () => {
      if (!validateManualForm()) {
        throw new Error('Formulaire invalide');
      }
      
      const { error } = await supabase
        .from('fishermen_contacts')
        .insert({
          fisherman_id: fisherman?.id,
          email: manualContact.email || null,
          phone: manualContact.phone || null,
          first_name: manualContact.first_name || null,
          last_name: manualContact.last_name || null,
          contact_group: manualContact.contact_group,
          notes: manualContact.notes || null
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
      setFormErrors({});
      setShowManualForm(false);
      queryClient.invalidateQueries({ queryKey: ['fisherman-contacts'] });
    },
    onError: (error: Error) => {
      if (error.message !== 'Formulaire invalide') {
        toast.error(getUserFriendlyError(error));
      }
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
    onError: (error) => {
      toast.error(getUserFriendlyError(error));
    }
  });

  // Export CSV
  const handleExport = () => {
    if (!contacts || contacts.length === 0) {
      toast.error("Aucun contact à exporter");
      return;
    }
    
    const csv = exportContactsToCSV(contacts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Contacts Clients</h1>
            <p className="text-muted-foreground">
              Gérez votre base de contacts pour envoyer des messages groupés
            </p>
          </div>
          {contacts && contacts.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          )}
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
                Format attendu: email, phone, first_name, last_name, contact_group
                <br />
                <span className="text-xs">Séparateur détecté automatiquement (virgule ou point-virgule)</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="email,phone,first_name,last_name,contact_group&#10;client@example.com,0612345678,Jean,Dupont,reguliers"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={6}
              />

              {/* Preview */}
              {csvPreview && csvPreview.contacts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Séparateur détecté: <code className="bg-muted px-1 rounded">{csvPreview.separator === ';' ? 'point-virgule' : 'virgule'}</code>
                    </span>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {csvPreview.validCount} valides
                    </Badge>
                    {csvPreview.invalidCount > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {csvPreview.invalidCount} invalides
                      </Badge>
                    )}
                  </div>

                  {/* Preview table (first 5) */}
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">État</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Groupe</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvPreview.contacts.slice(0, 5).map((contact, idx) => (
                          <TableRow key={idx} className={!contact.isValid ? 'bg-destructive/10' : ''}>
                            <TableCell>
                              {contact.isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {contact.email || '-'}
                              {contact.errors.includes('Email invalide') && (
                                <span className="text-destructive text-xs block">Format invalide</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {contact.phone || '-'}
                              {contact.errors.includes('Téléphone invalide') && (
                                <span className="text-destructive text-xs block">Format invalide</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {contact.first_name} {contact.last_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{contact.contact_group}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {csvPreview.contacts.length > 5 && (
                      <div className="text-center py-2 text-sm text-muted-foreground border-t">
                        ... et {csvPreview.contacts.length - 5} autres lignes
                      </div>
                    )}
                  </div>

                  {csvPreview.invalidCount > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {csvPreview.invalidCount} contact(s) invalide(s) seront ignorés lors de l'import.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <Button 
                onClick={() => importCSV.mutate()}
                disabled={!csvPreview || csvPreview.validCount === 0 || importCSV.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer {csvPreview?.validCount || 0} contact(s) valide(s)
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={manualContact.email}
                        onChange={(e) => {
                          setManualContact({...manualContact, email: e.target.value});
                          setFormErrors({...formErrors, email: ''});
                        }}
                        placeholder="client@example.com"
                        className={formErrors.email ? 'border-destructive' : ''}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        value={manualContact.phone}
                        onChange={(e) => {
                          setManualContact({...manualContact, phone: e.target.value});
                          setFormErrors({...formErrors, phone: ''});
                        }}
                        placeholder="06 12 34 56 78"
                        className={formErrors.phone ? 'border-destructive' : ''}
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>
                      )}
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
                        placeholder="general"
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
                      disabled={addManualContact.isPending}
                    >
                      Ajouter
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowManualForm(false);
                      setFormErrors({});
                    }}>
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
                <div className="overflow-x-auto">
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
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun contact pour le moment</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PecheurContacts;
