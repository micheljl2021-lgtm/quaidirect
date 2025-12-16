/**
 * Contact parsers for multiple file formats (CSV, VCF, JSON, Excel)
 */

import * as XLSX from 'xlsx';
import { validateEmail, validateFrenchPhone, type ParsedContact } from './validators';

/**
 * Parse VCF/vCard file format
 */
export function parseVCF(fileContent: string): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  const vcards = fileContent.split('BEGIN:VCARD');
  
  for (const vcard of vcards) {
    if (!vcard.trim()) continue;
    
    const contact: Partial<ParsedContact> = {
      email: null,
      phone: null,
      first_name: null,
      last_name: null,
      contact_group: 'general',
      isValid: false,
      errors: []
    };
    
    // Parse FN (Full Name)
    const fnMatch = vcard.match(/FN:(.+)/);
    if (fnMatch) {
      const names = fnMatch[1].trim().split(' ');
      contact.first_name = names[0];
      contact.last_name = names.slice(1).join(' ') || null;
    }
    
    // Parse N (Name structured - alternative)
    if (!contact.first_name) {
      const nMatch = vcard.match(/N:([^;\n]*);([^;\n]*)/);
      if (nMatch) {
        contact.last_name = nMatch[1].trim().replace(/\r/g, '') || null;
        contact.first_name = nMatch[2].trim().replace(/\r/g, '') || null;
      }
    }
    
    // Parse TEL (Phone)
    const telMatch = vcard.match(/TEL[^:]*:(.+)/);
    if (telMatch) {
      contact.phone = telMatch[1].trim().replace(/\r/g, '');
    }
    
    // Parse EMAIL
    const emailMatch = vcard.match(/EMAIL[^:]*:(.+)/);
    if (emailMatch) {
      contact.email = emailMatch[1].trim().replace(/\r/g, '');
    }
    
    // Parse ORG (Organization) - optionally set as professionnels group
    const orgMatch = vcard.match(/ORG:(.+)/);
    if (orgMatch) {
      const org = orgMatch[1].trim().replace(/\r/g, '');
      // Only set to professionnels if the default group is still being used
      if (!contact.contact_group || contact.contact_group === 'general') {
        contact.contact_group = 'professionnels';
      }
    }
    
    // Validate the contact
    const errors: string[] = [];
    
    if (!contact.email && !contact.phone) {
      errors.push('Email ou téléphone requis');
    }
    
    if (contact.email && !validateEmail(contact.email).isValid) {
      errors.push('Email invalide');
    }
    
    if (contact.phone && !validateFrenchPhone(contact.phone).isValid) {
      errors.push('Téléphone invalide');
    }
    
    contact.errors = errors;
    contact.isValid = errors.length === 0;
    
    // Only add if we have at least email or phone (even if invalid for preview)
    if (contact.email || contact.phone) {
      contacts.push(contact as ParsedContact);
    }
  }
  
  return contacts;
}

/**
 * Parse Excel file (.xlsx, .xls)
 */
export async function parseExcel(file: File): Promise<ParsedContact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        const contacts: ParsedContact[] = [];
        
        // Skip header row (index 0)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          // Expected column order: email, phone, first_name, last_name, contact_group
          // Document this format in the UI
          const email = (row[0] || '').toString().trim();
          const phone = (row[1] || '').toString().trim();
          const first_name = (row[2] || '').toString().trim();
          const last_name = (row[3] || '').toString().trim();
          const contact_group = (row[4] || 'general').toString().trim();
          
          const errors: string[] = [];
          
          if (!email && !phone) {
            errors.push('Email ou téléphone requis');
          }
          
          if (email && !validateEmail(email).isValid) {
            errors.push('Email invalide');
          }
          
          if (phone && !validateFrenchPhone(phone).isValid) {
            errors.push('Téléphone invalide');
          }
          
          // Only add if we have at least email or phone
          if (email || phone) {
            contacts.push({
              email: email || null,
              phone: phone || null,
              first_name: first_name || null,
              last_name: last_name || null,
              contact_group: contact_group || 'general',
              isValid: errors.length === 0,
              errors
            });
          }
        }
        
        resolve(contacts);
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse JSON file
 */
export function parseJSON(fileContent: string): ParsedContact[] {
  try {
    const data = JSON.parse(fileContent);
    const rawContacts = Array.isArray(data) ? data : [data];
    
    const contacts: ParsedContact[] = rawContacts.map((item: any) => {
      // Support multiple property names
      const email = item.email || item.Email || item.mail || null;
      const phone = item.phone || item.Phone || item.tel || item.telephone || null;
      const first_name = item.first_name || item.firstName || item.prenom || item.Prénom || null;
      const last_name = item.last_name || item.lastName || item.nom || item.Nom || null;
      const contact_group = item.contact_group || item.group || item.groupe || 'general';
      
      const errors: string[] = [];
      
      if (!email && !phone) {
        errors.push('Email ou téléphone requis');
      }
      
      if (email && !validateEmail(email).isValid) {
        errors.push('Email invalide');
      }
      
      if (phone && !validateFrenchPhone(phone).isValid) {
        errors.push('Téléphone invalide');
      }
      
      return {
        email: email || null,
        phone: phone || null,
        first_name: first_name || null,
        last_name: last_name || null,
        contact_group: contact_group || 'general',
        isValid: errors.length === 0,
        errors
      };
    });
    
    return contacts;
  } catch (error) {
    throw new Error('Format JSON invalide');
  }
}

/**
 * Detect file format based on filename and content
 */
export function detectFileFormat(
  filename: string, 
  content: string
): 'csv' | 'vcf' | 'json' | 'excel' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (ext === 'csv') return 'csv';
  if (ext === 'vcf' || ext === 'vcard') return 'vcf';
  if (ext === 'json') return 'json';
  if (ext === 'xlsx' || ext === 'xls') return 'excel';
  
  // Detection by content
  if (content.includes('BEGIN:VCARD')) return 'vcf';
  const trimmed = content.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
  
  return 'csv'; // Default to CSV
}

/**
 * Export type for format detection result
 */
export type FileFormat = 'csv' | 'vcf' | 'json' | 'excel' | 'unknown';
