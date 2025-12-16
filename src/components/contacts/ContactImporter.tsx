/**
 * ContactImporter - Modern file import component with drag & drop support
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { parseCSVContacts, type ParsedContact } from "@/lib/validators";
import { parseVCF, parseExcel, parseJSON, detectFileFormat, type FileFormat } from "@/lib/contactParsers";
import { validateContactsBatch } from "@/lib/contactValidation";
import ContactPreview from "./ContactPreview";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['fishermen_contacts']['Row'];

interface ContactImporterProps {
  existingContacts: Contact[];
  onImport: (contacts: ParsedContact[]) => void;
  isImporting: boolean;
}

export default function ContactImporter({
  existingContacts,
  onImport,
  isImporting
}: ContactImporterProps) {
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<FileFormat | null>(null);

  // Handle file parsing
  const handleFileContent = useCallback(async (file: File) => {
    const format = detectFileFormat(file.name, '');
    setDetectedFormat(format);

    try {
      let contacts: ParsedContact[] = [];

      if (format === 'excel') {
        contacts = await parseExcel(file);
      } else {
        const content = await file.text();
        const detectedFormat = detectFileFormat(file.name, content);

        switch (detectedFormat) {
          case 'vcf':
            contacts = parseVCF(content);
            break;
          case 'json':
            contacts = parseJSON(content);
            break;
          case 'csv':
          default:
            const result = parseCSVContacts(content);
            contacts = result.contacts;
            break;
        }
      }

      // Validate and check for duplicates
      const validatedContacts = validateContactsBatch(contacts, existingContacts);
      setParsedContacts(validatedContacts);

      // Auto-select all valid non-duplicate contacts
      const autoSelected = new Set(
        validatedContacts
          .map((c, idx) => ({ contact: c, idx }))
          .filter(({ contact }) => contact.isValid && !contact.isDuplicate)
          .map(({ idx }) => idx)
      );
      setSelectedContacts(autoSelected);

      const validCount = validatedContacts.filter(c => c.isValid && !c.isDuplicate).length;
      toast.success(`${validCount} contacts détectés`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier');
    }
  }, [existingContacts]);

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileContent(file);
    }
  };

  // Handle drag & drop
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileContent(file);
    }
  }, [handleFileContent]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Toggle contact selection
  const toggleContact = (index: number) => {
    const contact = parsedContacts[index];
    if (!contact.isValid || contact.isDuplicate) return;

    const newSelected = new Set(selectedContacts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedContacts(newSelected);
  };

  // Toggle all contacts
  const toggleAll = () => {
    const importableIndexes = parsedContacts
      .map((c, idx) => ({ contact: c, idx }))
      .filter(({ contact }) => contact.isValid && !contact.isDuplicate)
      .map(({ idx }) => idx);

    if (selectedContacts.size === importableIndexes.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(importableIndexes));
    }
  };

  // Handle import
  const handleImport = () => {
    const contactsToImport = Array.from(selectedContacts)
      .map(idx => parsedContacts[idx])
      .filter(c => c.isValid && !c.isDuplicate);
    
    if (contactsToImport.length === 0) {
      toast.error('Aucun contact sélectionné pour l\'import');
      return;
    }

    onImport(contactsToImport);
  };

  // Reset
  const handleReset = () => {
    setParsedContacts([]);
    setSelectedContacts(new Set());
    setDetectedFormat(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importer des contacts
        </CardTitle>
        <CardDescription>
          Formats supportés: CSV, VCF/vCard, Excel (.xlsx, .xls), JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsedContacts.length === 0 ? (
          // Drag & Drop Zone
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium mb-1">
                  Glissez-déposez un fichier ici
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  ou cliquez pour parcourir
                </p>
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Parcourir les fichiers
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.vcf,.vcard,.xlsx,.xls,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• CSV: email, phone, first_name, last_name, contact_group</p>
                <p>• VCF: Contacts iPhone/Android/Outlook</p>
                <p>• Excel: Feuille avec les mêmes colonnes que CSV</p>
                <p>• JSON: Tableau d'objets avec les mêmes propriétés</p>
              </div>
            </div>
          </div>
        ) : (
          // Preview and Import
          <div className="space-y-4">
            {detectedFormat && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Format détecté: <span className="font-medium uppercase">{detectedFormat}</span>
              </div>
            )}
            
            <ContactPreview
              contacts={parsedContacts}
              selectedContacts={selectedContacts}
              onToggleContact={toggleContact}
              onToggleAll={toggleAll}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={selectedContacts.size === 0 || isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Import en cours...' : `Importer ${selectedContacts.size} contact(s)`}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Nouveau fichier
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
