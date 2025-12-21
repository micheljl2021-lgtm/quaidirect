import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SalePoint {
  id: string;
  label: string;
  address: string;
  is_primary: boolean | null;
  photo_url?: string | null;
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

interface FishermanPhotos {
  boatPhoto: string | null;
  dockPhoto: string | null;
  favoritePhoto: string | null;
}

export interface QuickDropData {
  date: Date;
  timeSlot: string;
  customTime?: string;
  salePointId: string;
  speciesIds: string[];
}

export interface QuickDropResult {
  success: boolean;
  dropId: string | null;
  speciesName: string | null;
}

export function useQuickDrop() {
  const { user } = useAuth();
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<FishermanDefaults | null>(null);
  const [salePoints, setSalePoints] = useState<SalePoint[]>([]);
  const [speciesPresets, setSpeciesPresets] = useState<SpeciesPreset[]>([]);
  const [templates, setTemplates] = useState<DropTemplate[]>([]);
  const [fishermanPhotos, setFishermanPhotos] = useState<FishermanPhotos>({
    boatPhoto: null,
    dockPhoto: null,
    favoritePhoto: null,
  });
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
        // Fetch fisherman info with photos
        const { data: fisherman } = await supabase
          .from('fishermen')
          .select('id, default_sale_point_id, default_time_slot, photo_boat_1, photo_dock_sale, favorite_photo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!fisherman) {
          setIsLoading(false);
          return;
        }

        setFishermanId(fisherman.id);
        setDefaults(fisherman);
        setFishermanPhotos({
          boatPhoto: fisherman.photo_boat_1,
          dockPhoto: fisherman.photo_dock_sale,
          favoritePhoto: fisherman.favorite_photo_url,
        });

        // Fetch sale points with photos
        const { data: salePointsData } = await supabase
          .from('fisherman_sale_points')
          .select('id, label, address, is_primary, photo_url')
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

  // Helper function to get species name by ID
  const getSpeciesName = async (speciesId: string): Promise<string | null> => {
    try {
      const { data: species } = await supabase
        .from('species')
        .select('name')
        .eq('id', speciesId)
        .single();

      return species?.name || null;
    } catch (error) {
      console.error('Error fetching species name:', error);
      return null;
    }
  };

  // Get fallback photos based on selected sale point
  const getFallbackPhotos = (salePointId: string) => {
    const salePoint = salePoints.find(sp => sp.id === salePointId);
    return {
      boatPhoto: fishermanPhotos.boatPhoto || fishermanPhotos.dockPhoto,
      salePointPhoto: salePoint?.photo_url || null,
      favoritePhoto: fishermanPhotos.favoritePhoto,
    };
  };

  const publishQuickDrop = async (data: QuickDropData): Promise<QuickDropResult> => {
    if (!fishermanId || !data.salePointId || data.speciesIds.length === 0) {
      return { success: false, dropId: null, speciesName: null };
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

      // Get the first species name for the photo picker
      const firstSpeciesName = await getSpeciesName(data.speciesIds[0]);

      return { 
        success: true, 
        dropId: newDrop.id, 
        speciesName: firstSpeciesName 
      };
    } catch (error) {
      console.error('Error publishing quick drop:', error);
      return { success: false, dropId: null, speciesName: null };
    } finally {
      setIsPublishing(false);
    }
  };

  const publishFromTemplate = async (
    templateId: string, 
    overrides: { date: Date; timeSlot: string; customTime?: string; salePointId: string }
  ): Promise<QuickDropResult> => {
    if (!fishermanId) return { success: false, dropId: null, speciesName: null };

    setIsPublishing(true);

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return { success: false, dropId: null, speciesName: null };

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

      // Get the first species name for the photo picker
      let firstSpeciesName: string | null = null;
      if (firstSpeciesId) {
        firstSpeciesName = await getSpeciesName(firstSpeciesId);
      }

      // Increment template usage count
      await supabase
        .from('drop_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', templateId);

      return { 
        success: true, 
        dropId: newDrop.id, 
        speciesName: firstSpeciesName 
      };
    } catch (error) {
      console.error('Error publishing from template:', error);
      return { success: false, dropId: null, speciesName: null };
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
    fishermanPhotos,
    isLoading,
    isPublishing,
    canUseQuickDrop,
    publishQuickDrop,
    publishFromTemplate,
    getFallbackPhotos,
  };
}
