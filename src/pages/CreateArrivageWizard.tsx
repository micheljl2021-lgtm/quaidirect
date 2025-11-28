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
import { supabase } from "@/lib/supabase-client";
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

export interface ArrivageData {
  portId: string;
  portName: string;
  date: Date;
  timeSlot: string;
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
    portId: "",
    portName: "",
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
      portId: payload.portId || "",
      portName: payload.portName || "",
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

  const handleStep1Complete = (data: { portId: string; portName: string; date: Date; timeSlot: string }) => {
    setArrivageData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleStep2Complete = (species: ArrivageSpecies[]) => {
    setArrivageData((prev) => ({ ...prev, species }));
    setStep(3);
  };

  const handlePublish = async () => {
    if (!user) return;

    setIsPublishing(true);

    try {
      // Get fisherman ID
      const { data: fishermanData, error: fishermanError } = await supabase
        .from("fishermen")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (fishermanError) throw fishermanError;

      // Convert time slot to actual times
      const timeSlotMap: Record<string, { start: string; end: string }> = {
        matin: { start: "07:00", end: "09:00" },
        fin_matinee: { start: "09:00", end: "11:00" },
        midi: { start: "11:00", end: "13:00" },
        apres_midi: { start: "14:00", end: "17:00" },
      };

      const slot = timeSlotMap[arrivageData.timeSlot] || timeSlotMap.matin;
      
      // Create ETA and sale start time
      const etaDate = new Date(arrivageData.date);
      etaDate.setHours(parseInt(slot.start.split(":")[0]), parseInt(slot.start.split(":")[1]));
      
      const saleStartDate = new Date(etaDate);
      saleStartDate.setMinutes(saleStartDate.getMinutes() + 30);

      // Insert drop
      const { data: dropData, error: dropError } = await supabase
        .from("drops")
        .insert({
          fisherman_id: fishermanData.id,
          port_id: arrivageData.portId,
          eta_at: etaDate.toISOString(),
          sale_start_time: saleStartDate.toISOString(),
          visible_at: new Date().toISOString(),
          status: "scheduled",
        })
        .select()
        .single();

      if (dropError) throw dropError;

      // Insert species associations
      const speciesIds = [...new Set(arrivageData.species.map((s) => s.speciesId))];
      const dropSpeciesData = speciesIds.map((speciesId) => ({
        drop_id: dropData.id,
        species_id: speciesId,
      }));

      if (dropSpeciesData.length > 0) {
        const { error: speciesError } = await supabase
          .from("drop_species")
          .insert(dropSpeciesData);

        if (speciesError) throw speciesError;
      }

      // Insert offers
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

      const { error: offersError } = await supabase
        .from("offers")
        .insert(offersData);

      if (offersError) throw offersError;

      // Insert photos if any
      if (photos.length > 0) {
        const photosData = photos.map((url, index) => ({
          drop_id: dropData.id,
          photo_url: url,
          display_order: index,
        }));

        const { error: photosError } = await supabase
          .from("drop_photos")
          .insert(photosData);

        if (photosError) {
          console.error("Error inserting photos:", photosError);
        }
      }

      toast.success("Arrivage publié avec succès !");
      navigate("/pecheur/dashboard");
    } catch (error) {
      console.error("Error publishing arrivage:", error);
      toast.error("Erreur lors de la publication de l'arrivage");
    } finally {
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
                portId: arrivageData.portId,
                portName: arrivageData.portName,
                date: arrivageData.date,
                timeSlot: arrivageData.timeSlot,
              }}
              onComplete={handleStep1Complete}
              onCancel={() => navigate("/pecheur/dashboard")}
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
