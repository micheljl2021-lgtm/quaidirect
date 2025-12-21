import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SalePoint {
  id: string;
  label: string;
  address: string;
  is_primary: boolean | null;
}

interface SpeciesPreset {
  id: string;
  name: string;
  icon: string | null;
  species_data: any;
  usage_count: number | null;
}

interface DropTemplate {
  id: string;
  name: string;
  icon: string | null;
  payload: any;
  usage_count: number | null;
}

interface FishermanDefaults {
  id: string;
  default_sale_point_id: string | null;
  default_time_slot: string | null;
}

export interface QuickDropData {
  date: Date;
  timeSlot: string;
  customTime?: string;
  salePointId: string;
  speciesIds: string[];
}

export function useQuickDrop() {
  const { user } = useAuth();
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<FishermanDefaults | null>(null);
  const [salePoints, setSalePoints] = useState<SalePoint[]>([]);
  const [speciesPresets, setSpeciesPresets] = useState<SpeciesPreset[]>([]);
  const [templates, setTemplates] = useState<DropTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const canUseQuickDrop = salePoints.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch fisherman info
        const { data: fisherman } = await supabase
          .from('fishermen')
          .select('id, default_sale_point_id, default_time_slot')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!fisherman) {
          setIsLoading(false);
          return;
        }

        setFishermanId(fisherman.id);
        setDefaults(fisherman);

        // Fetch sale points
        const { data: salePointsData } = await supabase
          .from('fisherman_sale_points')
          .select('id, label, address, is_primary')
          .eq('fisherman_id', fisherman.id)
          .order('is_primary', { ascending: false });

        if (salePointsData) {
          setSalePoints(salePointsData);
        }

        // Fetch species presets
        const { data: presetsData } = await supabase
          .from('fishermen_species_presets')
          .select('*')
          .eq('fisherman_id', fisherman.id)
          .order('usage_count', { ascending: false })
          .limit(6);

        if (presetsData) {
          setSpeciesPresets(presetsData as SpeciesPreset[]);
        }

        // Fetch drop templates
        const { data: templatesData } = await supabase
          .from('drop_templates')
          .select('*')
          .eq('fisherman_id', fisherman.id)
          .order('usage_count', { ascending: false })
          .limit(10);

        if (templatesData) {
          setTemplates(templatesData as DropTemplate[]);
        }
      } catch (error) {
        console.error('Error fetching quick drop data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Helper function to fetch species photo from Pixabay
  const fetchSpeciesPhoto = async (speciesId: string): Promise<string | null> => {
    try {
      // Get species name first
      const { data: species } = await supabase
        .from('species')
        .select('name')
        .eq('id', speciesId)
        .single();

      if (!species?.name) return null;

      // Call the Edge Function to fetch from Pixabay
      const { data, error } = await supabase.functions.invoke('fetch-species-photo', {
        body: { speciesName: species.name },
      });

      if (error) {
        console.error('Error fetching species photo:', error);
        return null;
      }

      return data?.imageUrl || null;
    } catch (error) {
      console.error('Error in fetchSpeciesPhoto:', error);
      return null;
    }
  };

  const publishQuickDrop = async (data: QuickDropData): Promise<string | null> => {
    if (!fishermanId || !data.salePointId || data.speciesIds.length === 0) {
      return null;
    }

    setIsPublishing(true);

    try {
      // Calculate ETA based on date and time slot (or custom time)
      const eta = new Date(data.date);
      
      if (data.timeSlot === 'custom' && data.customTime) {
        // Parse custom time (format: HH:MM)
        const [hours, minutes] = data.customTime.split(':').map(Number);
        eta.setHours(hours, minutes, 0, 0);
      } else {
        const timeSlotHours: Record<string, number> = {
          'matin': 7,
          'fin_matinee': 10,
          'midi': 12,
          'apres_midi': 15,
        };
        eta.setHours(timeSlotHours[data.timeSlot] || 8, 0, 0, 0);
      }

      // Get sale point details for location
      const salePoint = salePoints.find(sp => sp.id === data.salePointId);

      // Create the drop
      const { data: newDrop, error: dropError } = await supabase
        .from('drops')
        .insert({
          fisherman_id: fishermanId,
          sale_point_id: data.salePointId,
          eta_at: eta.toISOString(),
          sale_start_time: eta.toISOString(),
          visible_at: new Date().toISOString(),
          status: 'scheduled',
          drop_type: 'quick',
        })
        .select('id')
        .single();

      if (dropError) throw dropError;

      // Insert species
      const speciesInserts = data.speciesIds.map(speciesId => ({
        drop_id: newDrop.id,
        species_id: speciesId,
      }));

      const { error: speciesError } = await supabase
        .from('drop_species')
        .insert(speciesInserts);

      if (speciesError) throw speciesError;

      // Try to fetch a photo for the first species and add it as drop photo
      if (data.speciesIds.length > 0) {
        const photoUrl = await fetchSpeciesPhoto(data.speciesIds[0]);
        
        if (photoUrl) {
          await supabase
            .from('drop_photos')
            .insert({
              drop_id: newDrop.id,
              photo_url: photoUrl,
              display_order: 0,
            });
          console.log('Added Pixabay photo to drop:', photoUrl);
        }
      }

      return newDrop.id;
    } catch (error) {
      console.error('Error publishing quick drop:', error);
      return null;
    } finally {
      setIsPublishing(false);
    }
  };

  const publishFromTemplate = async (
    templateId: string, 
    overrides: { date: Date; timeSlot: string; customTime?: string; salePointId: string }
  ): Promise<string | null> => {
    if (!fishermanId) return null;

    setIsPublishing(true);

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return null;

      // Calculate ETA
      const eta = new Date(overrides.date);
      
      if (overrides.timeSlot === 'custom' && overrides.customTime) {
        const [hours, minutes] = overrides.customTime.split(':').map(Number);
        eta.setHours(hours, minutes, 0, 0);
      } else {
        const timeSlotHours: Record<string, number> = {
          'matin': 7,
          'fin_matinee': 10,
          'midi': 12,
          'apres_midi': 15,
        };
        eta.setHours(timeSlotHours[overrides.timeSlot] || 8, 0, 0, 0);
      }

      // Create the drop from template
      const { data: newDrop, error: dropError } = await supabase
        .from('drops')
        .insert({
          fisherman_id: fishermanId,
          sale_point_id: overrides.salePointId,
          eta_at: eta.toISOString(),
          sale_start_time: eta.toISOString(),
          visible_at: new Date().toISOString(),
          status: 'scheduled',
          drop_type: 'template',
          notes: template.payload?.notes || null,
        })
        .select('id')
        .single();

      if (dropError) throw dropError;

      // Insert species from template if available
      let firstSpeciesId: string | null = null;
      if (template.payload?.species && Array.isArray(template.payload.species)) {
        const speciesInserts = template.payload.species.map((s: any) => ({
          drop_id: newDrop.id,
          species_id: s.speciesId,
        }));

        await supabase
          .from('drop_species')
          .insert(speciesInserts);

        firstSpeciesId = template.payload.species[0]?.speciesId || null;
      }

      // Try to fetch a photo for the first species
      if (firstSpeciesId) {
        const photoUrl = await fetchSpeciesPhoto(firstSpeciesId);
        
        if (photoUrl) {
          await supabase
            .from('drop_photos')
            .insert({
              drop_id: newDrop.id,
              photo_url: photoUrl,
              display_order: 0,
            });
        }
      }

      // Increment template usage count
      await supabase
        .from('drop_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', templateId);

      return newDrop.id;
    } catch (error) {
      console.error('Error publishing from template:', error);
      return null;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    fishermanId,
    defaults,
    salePoints,
    speciesPresets,
    templates,
    isLoading,
    isPublishing,
    canUseQuickDrop,
    publishQuickDrop,
    publishFromTemplate,
  };
}
