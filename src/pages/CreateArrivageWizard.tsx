import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { WizardProgressBar } from "@/components/arrivage-wizard/WizardProgressBar";
import { Step1LieuHoraire } from "@/components/arrivage-wizard/Step1LieuHoraire";
import { Step2EspecesQuantites } from "@/components/arrivage-wizard/Step2EspecesQuantites";
import { Step3Recapitulatif } from "@/components/arrivage-wizard/Step3Recapitulatif";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

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

  const [arrivageData, setArrivageData] = useState<ArrivageData>({
    portId: "",
    portName: "",
    date: new Date(),
    timeSlot: "matin",
    species: [],
  });

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
            />
          )}
        </div>
      </div>
    </div>
  );
}
