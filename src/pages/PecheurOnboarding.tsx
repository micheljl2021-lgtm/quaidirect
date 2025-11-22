import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { OnboardingStepIndicator } from "@/components/onboarding/OnboardingStepIndicator";
import { Step1Societe } from "@/components/onboarding/Step1Societe";
import { Step2Liens } from "@/components/onboarding/Step2Liens";
import { Step3ZonesMethodes } from "@/components/onboarding/Step3ZonesMethodes";
import { Step4Especes } from "@/components/onboarding/Step4Especes";
import { Step5Photos } from "@/components/onboarding/Step5Photos";

interface FormData {
  // Step 1
  siret: string;
  boatName: string;
  ownerName: string;
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  // Step 2
  facebookUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  // Step 3
  mainFishingZone: string;
  fishingZones: string;
  fishingMethods: string[];
  // Step 4
  selectedSpecies: string[];
  // Step 5
  photoBoat1: string;
  photoBoat2: string;
  photoDockSale: string;
  yearsExperience: string;
  passion: string;
  workStyle: string;
  clientMessage: string;
  generatedDescription: string;
}

const PecheurOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fishermenId, setFishermenId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    siret: "",
    boatName: "",
    ownerName: "",
    companyName: "",
    address: "",
    postalCode: "",
    city: "",
    phone: "",
    email: "",
    facebookUrl: "",
    instagramUrl: "",
    websiteUrl: "",
    mainFishingZone: "",
    fishingZones: "",
    fishingMethods: [],
    selectedSpecies: [],
    photoBoat1: "",
    photoBoat2: "",
    photoDockSale: "",
    yearsExperience: "",
    passion: "",
    workStyle: "",
    clientMessage: "",
    generatedDescription: "",
  });

  // Load existing data on mount
  useEffect(() => {
    if (!user) return;
    
    const loadExistingData = async () => {
      const { data: fisherman } = await supabase
        .from('fishermen')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fisherman) {
        setFishermenId(fisherman.id);
        setCurrentStep(fisherman.onboarding_step || 1);
        
        // Load saved data
        const savedData = fisherman.onboarding_data as Partial<FormData> || {};
        setFormData({
          siret: fisherman.siret || "",
          boatName: fisherman.boat_name || "",
          ownerName: fisherman.company_name || "",
          companyName: fisherman.company_name || "",
          address: fisherman.address || "",
          postalCode: fisherman.postal_code || "",
          city: fisherman.city || "",
          phone: fisherman.phone || "",
          email: fisherman.email || "",
          facebookUrl: fisherman.facebook_url || "",
          instagramUrl: fisherman.instagram_url || "",
          websiteUrl: fisherman.website_url || "",
          mainFishingZone: fisherman.main_fishing_zone || "",
          fishingZones: Array.isArray(fisherman.fishing_zones) ? fisherman.fishing_zones.join(', ') : "",
          fishingMethods: Array.isArray(fisherman.fishing_methods) ? fisherman.fishing_methods : [],
          selectedSpecies: savedData.selectedSpecies || [],
          photoBoat1: fisherman.photo_boat_1 || "",
          photoBoat2: fisherman.photo_boat_2 || "",
          photoDockSale: fisherman.photo_dock_sale || "",
          yearsExperience: fisherman.years_experience || "",
          passion: fisherman.passion_quote || "",
          workStyle: fisherman.work_philosophy || "",
          clientMessage: fisherman.client_message || "",
          generatedDescription: fisherman.generated_description || "",
        });
      }
    };

    loadExistingData();
  }, [user]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.siret || formData.siret.length !== 14) {
          toast.error("Le SIRET doit contenir 14 chiffres");
          return false;
        }
        if (!formData.boatName || !formData.ownerName || !formData.address || 
            !formData.postalCode || !formData.city || !formData.phone || !formData.email) {
          toast.error("Veuillez remplir tous les champs obligatoires");
          return false;
        }
        return true;
      case 2:
        return true; // Optional
      case 3:
        if (!formData.mainFishingZone) {
          toast.error("Veuillez sélectionner une zone principale de pêche");
          return false;
        }
        if (!formData.fishingMethods || formData.fishingMethods.length === 0) {
          toast.error("Veuillez sélectionner au moins une méthode de pêche");
          return false;
        }
        return true;
      case 4:
        if (!formData.selectedSpecies || formData.selectedSpecies.length === 0) {
          toast.error("Veuillez sélectionner au moins une espèce");
          return false;
        }
        return true;
      case 5:
        if (!formData.generatedDescription) {
          toast.error("Veuillez générer votre description");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSaveAndContinueLater = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const upsertData = {
        user_id: user.id,
        siret: formData.siret,
        boat_name: formData.boatName,
        boat_registration: formData.siret,
        company_name: formData.companyName || formData.ownerName,
        address: formData.address,
        postal_code: formData.postalCode,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
        facebook_url: formData.facebookUrl,
        instagram_url: formData.instagramUrl,
        website_url: formData.websiteUrl,
        main_fishing_zone: formData.mainFishingZone,
        fishing_zones: formData.fishingZones ? [formData.fishingZones] : null,
        fishing_methods: formData.fishingMethods as any,
        photo_boat_1: formData.photoBoat1,
        photo_boat_2: formData.photoBoat2,
        photo_dock_sale: formData.photoDockSale,
        years_experience: formData.yearsExperience,
        passion_quote: formData.passion,
        work_philosophy: formData.workStyle,
        client_message: formData.clientMessage,
        generated_description: formData.generatedDescription,
        onboarding_step: currentStep,
        onboarding_data: { selectedSpecies: formData.selectedSpecies },
      };

      const { error: upsertError } = await supabase
        .from('fishermen')
        .upsert([upsertData], { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      toast.success("Vos données ont été sauvegardées !");
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error("Impossible de sauvegarder vos données");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    await handleSaveAndContinueLater();

    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5) || !user) return;

    setLoading(true);
    try {
      // Final save
      const { data: fishermanData, error: fishermanError } = await supabase
        .from('fishermen')
        .upsert([{
          user_id: user.id,
          siret: formData.siret,
          boat_name: formData.boatName,
          boat_registration: formData.siret,
          company_name: formData.companyName || formData.ownerName,
          address: formData.address,
          postal_code: formData.postalCode,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          facebook_url: formData.facebookUrl,
          instagram_url: formData.instagramUrl,
          website_url: formData.websiteUrl,
          main_fishing_zone: formData.mainFishingZone,
          fishing_zones: formData.fishingZones ? [formData.fishingZones] : null,
          fishing_methods: formData.fishingMethods as any,
          photo_boat_1: formData.photoBoat1,
          photo_boat_2: formData.photoBoat2,
          photo_dock_sale: formData.photoDockSale,
          years_experience: formData.yearsExperience,
          passion_quote: formData.passion,
          work_philosophy: formData.workStyle,
          client_message: formData.clientMessage,
          generated_description: formData.generatedDescription,
          onboarding_step: 5,
          onboarding_data: {},
        }], { onConflict: 'user_id' })
        .select()
        .single();

      if (fishermanError) throw fishermanError;

      // Save species associations
      if (formData.selectedSpecies.length > 0 && fishermanData) {
        const speciesInserts = formData.selectedSpecies.map(speciesId => ({
          fisherman_id: fishermanData.id,
          species_id: speciesId,
        }));

        const { error: speciesError } = await supabase
          .from('fishermen_species')
          .upsert(speciesInserts);

        if (speciesError) throw speciesError;
      }

      toast.success("Profil créé avec succès !");
      navigate(`/onboarding/confirmation?slug=${fishermanData.slug}`);
    } catch (error) {
      console.error('Erreur soumission:', error);
      toast.error("Impossible de créer le profil");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Veuillez vous connecter pour accéder à cette page</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <OnboardingStepIndicator currentStep={currentStep} />

        {/* Form Card */}
        <Card className="p-8">
          {currentStep === 1 && (
            <Step1Societe formData={formData} onChange={handleFieldChange} />
          )}
          {currentStep === 2 && (
            <Step2Liens formData={formData} onChange={handleFieldChange} />
          )}
          {currentStep === 3 && (
            <Step3ZonesMethodes formData={formData} onChange={handleFieldChange} />
          )}
          {currentStep === 4 && (
            <Step4Especes formData={formData} onChange={handleFieldChange} />
          )}
          {currentStep === 5 && (
            <Step5Photos formData={formData} onChange={handleFieldChange} />
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            <Button
              variant="outline"
              onClick={handleSaveAndContinueLater}
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer & continuer plus tard
            </Button>

            {currentStep < 5 ? (
              <Button onClick={handleNext} disabled={loading}>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} size="lg">
                {loading ? "Finalisation..." : "Terminer"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PecheurOnboarding;