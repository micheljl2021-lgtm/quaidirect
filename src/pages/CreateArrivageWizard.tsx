import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardProgressBar } from "@/components/arrivage-wizard/WizardProgressBar";
import { Step1LieuHoraire } from "@/components/arrivage-wizard/Step1LieuHoraire";
import { Step2EspecesQuantites } from "@/components/arrivage-wizard/Step2EspecesQuantites";
import { Step3Recapitulatif } from "@/components/arrivage-wizard/Step3Recapitulatif";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package } from "lucide-react";

export interface ArrivageSpecies {
  id: string;
  speciesId: string;
  speciesName: string;
  quantity: number;
  unit: "kg" | "pieces";
  price: number;
  remark?: string;
}

export interface Step1Data {
  salePointId: string;
  salePointLabel: string;
  date: Date;
  timeSlot: string;
}

export interface ArrivageData extends Step1Data {
  species: ArrivageSpecies[];
}

export default function CreateArrivageWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [arrivageData, setArrivageData] = useState<ArrivageData>({
    salePointId: "",
    salePointLabel: "",
    date: new Date(),
    timeSlot: "matin",
    species: [],
  });

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user) return;
      
      try {
        const { data: fishermanData } = await supabase
          .from("fishermen")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (fishermanData) {
          const { data: templatesData } = await supabase
            .from("drop_templates")
            .select("*")
            .eq("fisherman_id", fishermanData.id)
            .order("usage_count", { ascending: false });

          if (templatesData) {
            setTemplates(templatesData);
          }
        }
      } catch (error) {
        console.error("Error loading templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [user]);

  const handleTemplateSelect = async (template: any) => {
    const payload = template.payload;
    
    setArrivageData({
      salePointId: payload.salePointId || "",
      salePointLabel: payload.salePointLabel || "",
      date: new Date(),
      timeSlot: payload.timeSlot || "matin",
      species: payload.species || [],
    });

    // Increment usage count
    await supabase
      .from("drop_templates")
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq("id", template.id);

    setShowTemplates(false);
    toast.success(`Modèle "${template.name}" chargé !`);
  };

  const handleStep1Complete = (data: Step1Data) => {
    setArrivageData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleStep2Complete = (species: ArrivageSpecies[]) => {
    setArrivageData((prev) => ({ ...prev, species }));
    setStep(3);
  };

  const handlePublish = async () => {
    console.log("🚀 [handlePublish] Démarrage publication arrivage");
    
    if (!user) {
      console.error("❌ [handlePublish] Pas d'utilisateur connecté");
      toast.error("Vous devez être connecté pour publier un arrivage");
      return;
    }

    // Validation stricte UUID
    if (!arrivageData.salePointId || arrivageData.salePointId.trim() === '') {
      console.error("❌ [handlePublish] Sale point ID vide");
      toast.error("Tu dois sélectionner un point de vente valide");
      setStep(1); // Retour à l'étape 1
      return;
    }

    if (arrivageData.species.length === 0) {
      console.error("❌ [handlePublish] Aucune espèce sélectionnée");
      toast.error("Tu dois ajouter au moins une espèce");
      setStep(2);
      return;
    }

    // Validation des UUIDs des espèces - évite l'erreur "invalid input syntax for type uuid"
    const invalidSpecies = arrivageData.species.filter(
      (s) => !s.speciesId || s.speciesId.trim() === '' || s.speciesId.length < 36
    );
    if (invalidSpecies.length > 0) {
      console.error("❌ [handlePublish] Espèces avec UUID invalide:", invalidSpecies);
      toast.error(
        `${invalidSpecies.length} espèce(s) ont des références invalides. Veuillez les resélectionner.`
      );
      setStep(2);
      return;
    }

    console.log("✅ [handlePublish] User:", user.id);
    console.log("✅ [handlePublish] Sale point ID:", arrivageData.salePointId);
    setIsPublishing(true);

    try {
      // Get fisherman ID
      console.log("📡 [handlePublish] Récupération profil pêcheur...");
      const { data: fishermanData, error: fishermanError } = await supabase
        .from("fishermen")
        .select("id, verified_at")
        .eq("user_id", user.id)
        .single();

      console.log("📊 [handlePublish] Fisherman data:", fishermanData, "Error:", fishermanError);

      if (fishermanError || !fishermanData) {
        console.error("❌ [handlePublish] Profil pêcheur introuvable");
        toast.error("Ton profil pêcheur n'est pas encore complet. Termine l'onboarding pour pouvoir publier un arrivage.");
        navigate("/pecheur/onboarding");
        return;
      }

      if (!fishermanData.verified_at) {
        console.error("❌ [handlePublish] Pêcheur non vérifié");
        toast.error("Ton compte pêcheur est en attente de validation par l'administrateur. Tu recevras un email une fois validé.");
        setIsPublishing(false);
        return;
      }

      console.log("✅ [handlePublish] Pêcheur vérifié:", fishermanData.id);

      // Get sale point coordinates
      console.log("📡 [handlePublish] Récupération point de vente:", arrivageData.salePointId);
      const { data: salePointData, error: salePointError } = await supabase
        .from('fisherman_sale_points')
        .select('*')
        .eq('id', arrivageData.salePointId)
        .single();

      console.log("📊 [handlePublish] Sale point data:", salePointData, "Error:", salePointError);

      if (!salePointData) {
        console.error("❌ [handlePublish] Point de vente introuvable");
        toast.error('Point de vente introuvable');
        setIsPublishing(false);
        return;
      }

      // Convert time slot to actual times
      const timeSlotMap: Record<string, { start: string; end: string }> = {
        matin: { start: "07:00", end: "09:00" },
        fin_matinee: { start: "09:00", end: "11:00" },
        midi: { start: "11:00", end: "13:00" },
        apres_midi: { start: "14:00", end: "17:00" },
      };

      const slot = timeSlotMap[arrivageData.timeSlot] || timeSlotMap.matin;
      
      const etaDate = new Date(arrivageData.date);
      etaDate.setHours(parseInt(slot.start.split(":")[0]), parseInt(slot.start.split(":")[1]));
      
      const saleStartDate = new Date(etaDate);
      saleStartDate.setMinutes(saleStartDate.getMinutes() + 30);

      console.log("📅 [handlePublish] Dates calculées - ETA:", etaDate.toISOString(), "Sale start:", saleStartDate.toISOString());

      const dropPayload = {
        fisherman_id: fishermanData.id,
        sale_point_id: arrivageData.salePointId,
        latitude: salePointData.latitude,
        longitude: salePointData.longitude,
        eta_at: etaDate.toISOString(),
        sale_start_time: saleStartDate.toISOString(),
        visible_at: new Date().toISOString(),
        status: "scheduled" as const,
        port_id: null,
      };

      console.log("📦 [handlePublish] Payload drop:", dropPayload);
      console.log("📡 [handlePublish] Insertion drop...");

      const { data: dropData, error: dropError } = await supabase
        .from("drops")
        .insert([dropPayload])
        .select()
        .single();

      console.log("📊 [handlePublish] Drop result:", dropData, "Error:", dropError);

      if (dropError) {
        console.error("❌ [handlePublish] Erreur insertion drop:", dropError);
        toast.error(`Erreur lors de la création du drop: ${dropError.message}`);
        throw dropError;
      }

      console.log("✅ [handlePublish] Drop créé:", dropData.id);

      // Insert species associations
      console.log("📡 [handlePublish] Insertion associations espèces...");
      const speciesIds = [...new Set(arrivageData.species.map((s) => s.speciesId))];
      const dropSpeciesData = speciesIds.map((speciesId) => ({
        drop_id: dropData.id,
        species_id: speciesId,
      }));

      console.log("📦 [handlePublish] Species data:", dropSpeciesData);

      if (dropSpeciesData.length > 0) {
        const { error: speciesError } = await supabase
          .from("drop_species")
          .insert(dropSpeciesData);

        if (speciesError) {
          console.error("❌ [handlePublish] Erreur insertion species:", speciesError);
          toast.error(`Erreur lors de l'ajout des espèces: ${speciesError.message}`);
          throw speciesError;
        }
        console.log("✅ [handlePublish] Espèces associées");
      }

      // Insert offers
      console.log("📡 [handlePublish] Insertion offres...");
      const offersData = arrivageData.species.map((species) => ({
        drop_id: dropData.id,
        species_id: species.speciesId,
        title: species.speciesName,
        description: species.remark || null,
        unit_price: species.price,
        total_units: species.quantity,
        available_units: species.quantity,
        price_type: species.unit === "kg" ? "per_kg" : "per_piece",
      }));

      console.log("📦 [handlePublish] Offers data:", offersData);

      const { error: offersError } = await supabase
        .from("offers")
        .insert(offersData);

      if (offersError) {
        console.error("❌ [handlePublish] Erreur insertion offers:", offersError);
        toast.error(`Erreur lors de l'ajout des offres: ${offersError.message}`);
        throw offersError;
      }

      console.log("✅ [handlePublish] Offres créées");

      // Insert photos if any
      if (photos.length > 0) {
        console.log("📡 [handlePublish] Insertion photos...");
        const photosData = photos.map((url, index) => ({
          drop_id: dropData.id,
          photo_url: url,
          display_order: index,
        }));

        console.log("📦 [handlePublish] Photos data:", photosData);

        const { error: photosError } = await supabase
          .from("drop_photos")
          .insert(photosData);

        if (photosError) {
          console.error("❌ [handlePublish] Erreur insertion photos:", photosError);
          toast.error(`Erreur lors de l'ajout des photos: ${photosError.message}`);
        } else {
          console.log("✅ [handlePublish] Photos ajoutées");
        }
      }

      console.log("🎉 [handlePublish] Publication réussie!");
      toast.success("Arrivage publié avec succès !");
      navigate("/dashboard/pecheur");
    } catch (error: any) {
      console.error("💥 [handlePublish] Erreur fatale:", error);
      const errorMessage = error?.message || error?.error_description || "Erreur inconnue";
      toast.error(`Erreur lors de la publication: ${errorMessage}`);
    } finally {
      console.log("🏁 [handlePublish] Fin du processus");
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Créer un arrivage en 2 minutes
          </h1>
          <p className="text-muted-foreground">
            Déclare ton débarquement, et on s'occupe de prévenir tes clients.
          </p>
        </div>

        {/* Progress Bar */}
        <WizardProgressBar currentStep={step} totalSteps={3} />

        {/* Templates Section */}
        {showTemplates && templates.length > 0 && step === 1 && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Modèles rapides
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gagne du temps avec tes arrivages habituels
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="lg"
                      className="h-auto py-4 justify-start"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <span className="text-2xl mr-3">{template.icon || "⭐"}</span>
                      <div className="text-left flex-1">
                        <div className="font-semibold">{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.payload?.species?.length || 0} espèces
                          {template.usage_count > 0 && ` • Utilisé ${template.usage_count}x`}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setShowTemplates(false)}
                >
                  Créer un arrivage depuis zéro
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Steps */}
        <div className="mt-8">
          {step === 1 && (
            <Step1LieuHoraire
              initialData={{
                salePointId: arrivageData.salePointId,
                salePointLabel: arrivageData.salePointLabel,
                date: arrivageData.date,
                timeSlot: arrivageData.timeSlot,
              }}
              onComplete={handleStep1Complete}
              onCancel={() => navigate("/dashboard/pecheur")}
            />
          )}

          {step === 2 && (
            <Step2EspecesQuantites
              initialSpecies={arrivageData.species}
              onComplete={handleStep2Complete}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <Step3Recapitulatif
              arrivageData={arrivageData}
              onPublish={handlePublish}
              onEditLieu={() => setStep(1)}
              onEditSpecies={() => setStep(2)}
              isPublishing={isPublishing}
              photos={photos}
              onPhotosChange={setPhotos}
            />
          )}
        </div>
      </div>
    </div>
  );
}
