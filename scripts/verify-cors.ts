/**
 * Script de vérification CORS pour QuaiDirect
 * Vérifie que toutes les Edge Functions ont des CORS correctement configurés
 * 
 * Usage: npx ts-node scripts/verify-cors.ts
 */

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const EXPECTED_ORIGIN = 'https://quaidirect.fr';
const FUNCTIONS_DIR = 'supabase/functions';

interface CorsCheckResult {
  function: string;
  hasCorrectCors: boolean;
  corsValue: string | null;
  issues: string[];
}

function checkCorsInFunction(functionName: string): CorsCheckResult {
  const indexPath = join(FUNCTIONS_DIR, functionName, 'index.ts');
  let content: string;
  
  try {
    content = readFileSync(indexPath, 'utf-8');
  } catch {
    return {
      function: functionName,
      hasCorrectCors: false,
      corsValue: null,
      issues: ['Fichier index.ts non trouvé']
    };
  }
  
  const issues: string[] = [];
  let corsValue: string | null = null;
  
  // Chercher le pattern CORS
  const corsPatterns = [
    /['"]Access-Control-Allow-Origin['"]:\s*['"]([^'"]+)['"]/g,
    /Access-Control-Allow-Origin['"]\s*:\s*['"]([^'"]+)['"]/g
  ];
  
  for (const pattern of corsPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      corsValue = match[1];
      
      if (corsValue === '*') {
        issues.push(`CORS trop permissif: '*' trouvé`);
      } else if (!corsValue.includes(EXPECTED_ORIGIN)) {
        issues.push(`CORS non configuré pour ${EXPECTED_ORIGIN}: '${corsValue}'`);
      }
    }
  }
  
  if (!corsValue) {
    issues.push('Aucune configuration CORS trouvée');
  }
  
  // Vérifier le handler OPTIONS
  if (!content.includes("req.method === 'OPTIONS'") && 
      !content.includes('req.method === "OPTIONS"')) {
    issues.push('Handler OPTIONS manquant');
  }
  
  return {
    function: functionName,
    hasCorrectCors: issues.length === 0 && corsValue?.includes(EXPECTED_ORIGIN),
    corsValue,
    issues
  };
}

function main() {
  console.log('🔍 Vérification CORS des Edge Functions QuaiDirect\n');
  console.log(`Origine attendue: ${EXPECTED_ORIGIN}\n`);
  console.log('='.repeat(60));
  
  const functions = readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  const results: CorsCheckResult[] = [];
  let passCount = 0;
  let failCount = 0;
  
  for (const func of functions) {
    const result = checkCorsInFunction(func);
    results.push(result);
    
    if (result.hasCorrectCors) {
      console.log(`✅ ${func}`);
      passCount++;
    } else {
      console.log(`❌ ${func}`);
      result.issues.forEach(issue => console.log(`   └─ ${issue}`));
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Résultats:`);
  console.log(`   ✅ Conformes: ${passCount}/${functions.length}`);
  console.log(`   ❌ Non conformes: ${failCount}/${functions.length}`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Des corrections sont nécessaires!');
    process.exit(1);
  } else {
    console.log('\n🎉 Toutes les Edge Functions sont correctement configurées!');
    process.exit(0);
  }
}

main();
