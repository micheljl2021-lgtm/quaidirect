/**
 * ContactPreview - Preview contacts before import with validation and duplicate detection
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { validateEmail, validateFrenchPhone, type ParsedContact } from "@/lib/validators";
import { getImportStats } from "@/lib/contactValidation";

interface ContactPreviewProps {
  contacts: ParsedContact[];
  selectedContacts: Set<number>;
  onToggleContact: (index: number) => void;
  onToggleAll: () => void;
}

export default function ContactPreview({
  contacts,
  selectedContacts,
  onToggleContact,
  onToggleAll
}: ContactPreviewProps) {
  const stats = getImportStats(contacts);
  const allSelected = contacts.length > 0 && selectedContacts.size === contacts.filter(c => c.isValid && !c.isDuplicate).length;
  
  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Badge variant="outline" className="bg-blue-50">
          <Info className="h-3 w-3 mr-1" />
          {stats.total} total
        </Badge>
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {stats.valid} valides
        </Badge>
        {stats.invalid > 0 && (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            {stats.invalid} invalides
          </Badge>
        )}
        {stats.duplicates > 0 && (
          <Badge variant="secondary">
            {stats.duplicates} doublons
          </Badge>
        )}
        <Badge variant="default" className="bg-blue-600">
          {stats.importable} importables
        </Badge>
      </div>

      {/* Preview Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onToggleAll}
                  aria-label="Sélectionner tout"
                />
              </TableHead>
              <TableHead className="w-[40px]">État</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Groupe</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Aucun contact à afficher
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact, idx) => {
                const canSelect = contact.isValid && !contact.isDuplicate;
                const isSelected = selectedContacts.has(idx);
                
                return (
                  <TableRow 
                    key={idx} 
                    className={!contact.isValid ? 'bg-destructive/10' : contact.isDuplicate ? 'bg-yellow-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        disabled={!canSelect}
                        onCheckedChange={() => onToggleContact(idx)}
                        aria-label={`Sélectionner contact ${idx + 1}`}
                      />
                    </TableCell>
                    <TableCell>
                      {contact.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.first_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.last_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.email || '-'}
                      {contact.email && !validateEmail(contact.email).isValid && (
                        <span className="text-destructive text-xs block">Format invalide</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contact.phone || '-'}
                      {contact.phone && !validateFrenchPhone(contact.phone).isValid && (
                        <span className="text-destructive text-xs block">Format invalide</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {contact.contact_group}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.isDuplicate ? (
                        <Badge variant="secondary" className="text-xs">
                          Doublon
                        </Badge>
                      ) : contact.isValid ? (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Nouveau
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Invalide
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {contacts.length > 10 && (
          <div className="text-center py-2 text-sm text-muted-foreground border-t bg-muted/30">
            {contacts.length} contacts au total
          </div>
        )}
      </div>

      {/* Warnings */}
      {stats.invalid > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {stats.invalid} contact(s) invalide(s) ne pourront pas être importés.
          </AlertDescription>
        </Alert>
      )}
      
      {stats.duplicates > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {stats.duplicates} contact(s) en doublon détectés (même email ou téléphone).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
