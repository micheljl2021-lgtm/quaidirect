import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpeciesChips } from "./SpeciesChips";
import { SpeciesTable } from "./SpeciesTable";
import { TemplatesRapides } from "./TemplatesRapides";
import { SavePresetDialog } from "./SavePresetDialog";
import { SpeciesCookingInfo, getCookingMethodsArray } from "./SpeciesCookingInfo";
import { ArrivageSpecies } from "@/pages/CreateArrivageWizard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Star, X, Camera, FileText, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SaleType } from "./SaleTypeSelector";
import { DropPhotosUpload } from "@/components/DropPhotosUpload";
import { DefaultPhotoSelector, DEFAULT_PHOTO_URLS } from "@/components/DefaultPhotoSelector";

interface Step2Props {
  initialSpecies: ArrivageSpecies[];
  onComplete: (species: ArrivageSpecies[], photos?: string[], notes?: string) => void;
  onBack: () => void;
  saleType: SaleType;
  initialPhotos?: string[];
  initialNotes?: string;
  salePointLabel?: string;
  timeSlot?: string;
}

interface Species {
  id: string;
  name: string;
  indicative_price: number | null;
  cooking_plancha?: boolean | null;
  cooking_friture?: boolean | null;
  cooking_grill?: boolean | null;
  cooking_sushi_tartare?: boolean | null;
  cooking_vapeur?: boolean | null;
  cooking_four?: boolean | null;
  cooking_poele?: boolean | null;
  cooking_soupe?: boolean | null;
  cooking_bouillabaisse?: boolean | null;
  flavor?: string | null;
  bones_level?: string | null;
  budget?: string | null;
  cooking_tips?: string | null;
}

// Helper to check if species needs enrichment
const needsEnrichment = (species: Species): boolean => {
  return !species.flavor || 
         !species.bones_level || 
         !species.cooking_tips ||
         species.cooking_plancha === null;
};

export function Step2EspecesQuantites({ 
  initialSpecies, 
  onComplete, 
  onBack, 
  saleType,
  initialPhotos = [],
  initialNotes = "",
  salePointLabel = "",
  timeSlot = "matin"
}: Step2Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSpecies, setSelectedSpecies] = useState<ArrivageSpecies[]>(initialSpecies);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [suggestedSpecies, setSuggestedSpecies] = useState<Species[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSpecies, setFilteredSpecies] = useState<Species[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [enrichingSpeciesIds, setEnrichingSpeciesIds] = useState<Set<string>>(new Set());
  
  // Mode simple: photos et notes
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [notes, setNotes] = useState(initialNotes);

  // Function to enrich species in background
  const enrichSpeciesInBackground = useCallback(async (speciesId: string, speciesName: string) => {
    // Skip if already enriching
    if (enrichingSpeciesIds.has(speciesId)) return;

    setEnrichingSpeciesIds(prev => new Set(prev).add(speciesId));
    
    try {
      console.log(`Enriching species: ${speciesName}`);
      const { data, error } = await supabase.functions.invoke('enrich-species', {
        body: { species_id: speciesId }
      });

      if (error) {
        console.error("Enrichment error:", error);
        return;
      }

      if (data?.success && data?.enriched && data?.species) {
        // Update allSpecies with enriched data
        setAllSpecies(prev => prev.map(s => 
          s.id === speciesId ? { ...s, ...data.species } : s
        ));
        
        // Update suggestedSpecies with enriched data
        setSuggestedSpecies(prev => prev.map(s => 
          s.id === speciesId ? { ...s, ...data.species } : s
        ));

        console.log(`Successfully enriched: ${speciesName}`);
      }
    } catch (err) {
      console.error("Failed to enrich species:", err);
    } finally {
      setEnrichingSpeciesIds(prev => {
        const next = new Set(prev);
        next.delete(speciesId);
        return next;
      });
    }
  }, [enrichingSpeciesIds]);

  useEffect(() => {
    const fetchSpecies = async () => {
      if (!user) return;

      const { data: fishermanData } = await supabase
        .from("fishermen")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!fishermanData) return;

      // Fetch all species with cooking info
      const { data: speciesData } = await supabase
        .from("species")
        .select(`
          id, name, indicative_price,
          cooking_plancha, cooking_friture, cooking_grill, cooking_sushi_tartare,
          cooking_vapeur, cooking_four, cooking_poele, cooking_soupe, cooking_bouillabaisse,
          flavor, bones_level, budget, cooking_tips
        `)
        .order("name");

      if (speciesData) {
        setAllSpecies(speciesData as Species[]);
        setFilteredSpecies(speciesData as Species[]);
      }

      // Fetch preferred species from fishermen_species table (priority over history)
      const { data: fishermenSpecies } = await supabase
        .from("fishermen_species")
        .select(`
          species_id, is_primary, 
          species:species_id(
            id, name, indicative_price,
            cooking_plancha, cooking_friture, cooking_grill, cooking_sushi_tartare,
            cooking_vapeur, cooking_four, cooking_poele, cooking_soupe, cooking_bouillabaisse,
            flavor, bones_level, budget, cooking_tips
          )
        `)
        .eq("fisherman_id", fishermanData.id)
        .order("is_primary", { ascending: false });

      if (fishermenSpecies && fishermenSpecies.length > 0) {
        const preferred = fishermenSpecies
          .filter((fs: any) => fs.species)
          .map((fs: any) => ({
            ...fs.species,
            is_primary: fs.is_primary
          }));
        
        if (preferred.length > 0) {
          setSuggestedSpecies(preferred.slice(0, 8));
          return;
        }
      }

      // Fallback: use history-based suggestions
      const { data: dropsData } = await supabase
        .from("drops")
        .select("id")
        .eq("fisherman_id", fishermanData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (dropsData && dropsData.length > 0) {
        const dropIds = dropsData.map(d => d.id);
        
        const { data: historyData } = await supabase
          .from("offers")
          .select(`
            species_id, 
            species:species_id(
              id, name, indicative_price,
              cooking_plancha, cooking_friture, cooking_grill, cooking_sushi_tartare,
              cooking_vapeur, cooking_four, cooking_poele, cooking_soupe, cooking_bouillabaisse,
              flavor, bones_level, budget, cooking_tips
            )
          `)
          .in("drop_id", dropIds);

        if (historyData) {
          const speciesCount: Record<string, { species: any; count: number }> = {};
          
          historyData.forEach((offer: any) => {
            if (offer.species) {
              const id = offer.species.id;
              if (!speciesCount[id]) {
                speciesCount[id] = { species: offer.species, count: 0 };
              }
              speciesCount[id].count++;
            }
          });

          const suggested = Object.values(speciesCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map(item => item.species);

          if (suggested.length > 0) {
            setSuggestedSpecies(suggested);
          } else {
            setSuggestedSpecies((speciesData as Species[])?.slice(0, 6) || []);
          }
        }
      } else {
        setSuggestedSpecies((speciesData as Species[])?.slice(0, 6) || []);
      }
    };

    fetchSpecies();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allSpecies.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSpecies(filtered);
    } else {
      setFilteredSpecies([]);
    }
  }, [searchQuery, allSpecies]);

  const handleSpeciesClick = (species: Species) => {
    const exists = selectedSpecies.find((s) => s.speciesId === species.id);
    if (exists) return;

    const newSpecies: ArrivageSpecies = {
      id: crypto.randomUUID(),
      speciesId: species.id,
      speciesName: species.name,
      quantity: 1,
      unit: "kg",
      price: species.indicative_price || 15,
      remark: "",
    };

    setSelectedSpecies([...selectedSpecies, newSpecies]);
    setSearchQuery("");

    // Trigger enrichment in background if needed
    if (needsEnrichment(species)) {
      enrichSpeciesInBackground(species.id, species.name);
    }
  };

  const handleTemplateSelect = (template: ArrivageSpecies[]) => {
    setSelectedSpecies(template);
  };

  const handleUpdateSpecies = (updatedSpecies: ArrivageSpecies[]) => {
    setSelectedSpecies(updatedSpecies);
  };

  const handleSavePreset = async (name: string, icon: string) => {
    if (!user) return;

    const { data: fishermanData } = await supabase
      .from("fishermen")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!fishermanData) return;

    const speciesData = selectedSpecies.map((s) => ({
      speciesId: s.speciesId,
      speciesName: s.speciesName,
      quantity: s.quantity,
      unit: s.unit,
      price: s.price,
    }));

    const { error } = await supabase
      .from("fishermen_species_presets")
      .insert({
        fisherman_id: fishermanData.id,
        name,
        icon,
        species_data: speciesData,
      });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le favori",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Favori sauvegardé",
        description: `"${name}" est maintenant disponible dans tes favoris`,
      });
    }
  };

  const handleGenerateDescription = async () => {
    if (selectedSpecies.length === 0) {
      toast({
        title: "Aucune espèce",
        description: "Sélectionne d'abord des espèces pour générer une description",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDescription(true);
    
    try {
      // Get cooking methods for each species
      const speciesWithCooking = selectedSpecies.map(s => {
        const speciesInfo = allSpecies.find(sp => sp.id === s.speciesId);
        return {
          speciesName: s.speciesName,
          cookingMethods: speciesInfo ? getCookingMethodsArray(speciesInfo) : [],
          flavor: speciesInfo?.flavor || null,
        };
      });

      const { data, error } = await supabase.functions.invoke('generate-arrival-description', {
        body: {
          species: speciesWithCooking,
          salePointLabel,
          timeSlot,
        }
      });

      if (error) throw error;

      if (data?.description) {
        setNotes(data.description);
        toast({
          title: "Description générée",
          description: "Tu peux la modifier si besoin",
        });
      }
    } catch (error: any) {
      console.error("Error generating description:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer la description",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleContinue = () => {
    if (selectedSpecies.length === 0) return;
    if (saleType === "simple") {
      onComplete(selectedSpecies, photos, notes);
    } else {
      onComplete(selectedSpecies);
    }
  };

  const handlePhotoSelect = (url: string) => {
    if (photos.includes(url)) {
      setPhotos(photos.filter(p => p !== url));
    } else if (photos.length < 5) {
      setPhotos([...photos, url]);
    }
  };

  // Get species info for display
  const getSpeciesInfo = (speciesId: string): Species | undefined => {
    return allSpecies.find(s => s.id === speciesId);
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Qu'est-ce que tu débarques ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TemplatesRapides onTemplateSelect={handleTemplateSelect} />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <label className="block text-sm font-medium">Mes espèces habituelles</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedSpecies.map((species) => (
                <button
                  key={species.id}
                  type="button"
                  onClick={() => handleSpeciesClick(species)}
                  disabled={selectedSpecies.some(s => s.speciesId === species.id)}
                  className="group relative flex items-center gap-2 px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium text-sm">{species.name}</span>
                  {enrichingSpeciesIds.has(species.id) ? (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <SpeciesCookingInfo species={species} compact />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Ajouter une espèce</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Tape le nom de l'espèce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            {filteredSpecies.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {filteredSpecies.map((species) => (
                  <button
                    key={species.id}
                    type="button"
                    onClick={() => handleSpeciesClick(species)}
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <span>{species.name}</span>
                    <SpeciesCookingInfo species={species} compact />
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSpecies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">
                  Espèces sélectionnées ({selectedSpecies.length})
                </label>
                {saleType === "detailed" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    <Star className="h-4 w-4 mr-2" aria-hidden="true" />
                    Sauvegarder ce favori
                  </Button>
                )}
              </div>
              
              {saleType === "detailed" ? (
                <SpeciesTable species={selectedSpecies} onUpdate={handleUpdateSpecies} />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSpecies.map((species) => {
                    const speciesInfo = getSpeciesInfo(species.speciesId);
                    const isEnriching = enrichingSpeciesIds.has(species.speciesId);
                    return (
                      <Badge
                        key={species.id}
                        variant="default"
                        className="cursor-pointer py-2 px-3 text-sm group"
                        onClick={() => {
                          setSelectedSpecies(selectedSpecies.filter((s) => s.id !== species.id));
                        }}
                      >
                        <span className="flex items-center gap-1.5">
                          {species.speciesName}
                          {isEnriching ? (
                            <Loader2 className="h-3 w-3 animate-spin text-primary-foreground/70" />
                          ) : (
                            speciesInfo && <SpeciesCookingInfo species={speciesInfo} compact />
                          )}
                          <X className="h-3 w-3 ml-1 group-hover:text-destructive" />
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedSpecies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Clique sur une espèce suggérée ou recherche-la pour commencer
            </div>
          )}

          {/* Mode simple: Photos et Description */}
          {saleType === "simple" && selectedSpecies.length > 0 && (
            <>
              {/* Photos Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
                  <label className="block text-sm font-medium">
                    Photos de la pêche ({photos.length}/5)
                  </label>
                </div>
                <DropPhotosUpload
                  maxPhotos={5}
                  onPhotosChange={setPhotos}
                  initialPhotos={photos}
                />
                <DefaultPhotoSelector
                  onSelect={handlePhotoSelect}
                  selectedUrl={photos.find(p => DEFAULT_PHOTO_URLS.includes(p))}
                />
                {photos.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      ✅ {photos.length} photo(s) ajoutée(s) • Des photos augmentent vos ventes de 40%
                    </p>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                    <label className="block text-sm font-medium">
                      Description / Notes (optionnel)
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription || selectedSpecies.length === 0}
                    className="gap-2"
                  >
                    {isGeneratingDescription ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Générer
                  </Button>
                </div>
                <Textarea
                  placeholder="Ex: Belle pêche de roche, mélange du jour (rougets, sars, daurades...), arrivage du matin..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Ces notes seront visibles par les clients sur l'arrivage
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SavePresetDialog
        species={selectedSpecies}
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSavePreset}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
        <div className="container max-w-4xl mx-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 h-14"
            onClick={onBack}
          >
            Retour à l'étape 1
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1 h-14 text-lg"
            onClick={handleContinue}
            disabled={selectedSpecies.length === 0}
          >
            Continuer (Récapitulatif)
          </Button>
        </div>
      </div>
    </div>
  );
}
