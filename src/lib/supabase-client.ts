import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

// Wrapper temporaire pour contourner les problèmes de types jusqu'à ce que les types soient régénérés
export const supabase = supabaseClient as unknown as SupabaseClient<any>;
