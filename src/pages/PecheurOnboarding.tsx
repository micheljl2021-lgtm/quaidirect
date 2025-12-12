import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Save, X } from "lucide-react";
import { usePortFile } from "@/hooks/usePortFile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OnboardingStepIndicator } from "@/components/onboarding/OnboardingStepIndicator";
import { Step1Societe } from "@/components/onboarding/Step1Societe";
import { Step2Liens } from "@/components/onboarding/Step2Liens";
import { Step3ZonesMethodes } from "@/components/onboarding/Step3ZonesMethodes";
import { Step4Especes } from "@/components/onboarding/Step4Especes";
import { Step5Photos } from "@/components/onboarding/Step5Photos";
import { Step6PointsVente } from "@/components/onboarding/Step6PointsVente";

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
  zoneId: string;
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
  // Step 6
  salePoint1Label: string;
  salePoint1Address: string;
  salePoint1Description: string;
  salePoint1Lat: number | undefined;
  salePoint1Lng: number | undefined;
  salePoint2Label: string;
  salePoint2Address: string;
  salePoint2Description: string;
  salePoint2Lat: number | undefined;
  salePoint2Lng: number | undefined;
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
    zoneId: "",
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
    salePoint1Label: "",
    salePoint1Address: "",
    salePoint1Description: "",
    salePoint1Lat: undefined,
    salePoint1Lng: undefined,
    salePoint2Label: "",
    salePoint2Address: "",
    salePoint2Description: "",
    salePoint2Lat: undefined,
    salePoint2Lng: undefined,
  });
  
  const { basin, portFile } = usePortFile(formData.postalCode?.substring(0, 2));

  // Load existing data on mount
  useEffect(() => {
    if (!user) return;
    
    const loadExistingData = async () => {
      const { data: fisherman } = await supabase
        .from('fishermen')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Check payment status (skip for whitelisted users)
      const { data: whitelistData } = await supabase
        .from('fisherman_whitelist')
        .select('id')
        .eq('email', user.email?.toLowerCase())
        .maybeSingle();
      
      const isWhitelisted = !!whitelistData;
      
      // Check if user has paid via fishermen table OR payments table OR has fisherman role
      if (!isWhitelisted && (!fisherman || fisherman.onboarding_payment_status !== 'paid')) {
        // Check payments table for any active fisherman subscription
        const { data: payment } = await supabase
          .from('payments')
          .select('status, plan')
          .eq('user_id', user.id)
          .ilike('plan', 'fisherman_%')
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // Check if user has fisherman role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'fisherman')
          .maybeSingle();
        
        const hasActivePayment = !!payment;
        const hasFishermanRole = !!roleData;
        
        // If has role or payment, allow access
        if (!hasActivePayment && !hasFishermanRole) {
          toast.error(
            "Votre paiement n'a pas été trouvé. Si vous venez de payer, attendez quelques secondes et rafraîchissez la page.",
            { duration: 6000 }
          );
          navigate('/pecheur/payment');
          return;
        }
      }

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
          zoneId: fisherman.zone_id || "",
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
          salePoint1Label: savedData.salePoint1Label || "",
          salePoint1Address: savedData.salePoint1Address || "",
          salePoint1Description: savedData.salePoint1Description || "",
          salePoint1Lat: savedData.salePoint1Lat,
          salePoint1Lng: savedData.salePoint1Lng,
          salePoint2Label: savedData.salePoint2Label || "",
          salePoint2Address: savedData.salePoint2Address || "",
          salePoint2Description: savedData.salePoint2Description || "",
          salePoint2Lat: savedData.salePoint2Lat,
          salePoint2Lng: savedData.salePoint2Lng,
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
      case 6:
        if (!formData.salePoint1Label || !formData.salePoint1Address) {
          toast.error("Veuillez remplir au moins un point de vente");
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
        zone_id: formData.zoneId || null,
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
        onboarding_data: { 
          selectedSpecies: formData.selectedSpecies,
          salePoint1Label: formData.salePoint1Label,
          salePoint1Address: formData.salePoint1Address,
          salePoint1Description: formData.salePoint1Description,
          salePoint1Lat: formData.salePoint1Lat,
          salePoint1Lng: formData.salePoint1Lng,
          salePoint2Label: formData.salePoint2Label,
          salePoint2Address: formData.salePoint2Address,
          salePoint2Description: formData.salePoint2Description,
          salePoint2Lat: formData.salePoint2Lat,
          salePoint2Lng: formData.salePoint2Lng,
        },
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

    if (currentStep < 6) {
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
    if (!validateStep(6) || !user) return;

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
          zone_id: formData.zoneId || null,
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
          onboarding_step: 6,
          onboarding_data: {},
        }], { onConflict: 'user_id' })
        .select()
        .single();

      if (fishermanError) throw fishermanError;

      // Delete existing sale points before re-inserting
      await supabase
        .from('fisherman_sale_points')
        .delete()
        .eq('fisherman_id', fishermanData.id);

      // Save sale points with coordinates
      const salePointsToInsert = [];
      
      if (formData.salePoint1Label && formData.salePoint1Address) {
        salePointsToInsert.push({
          fisherman_id: fishermanData.id,
          label: formData.salePoint1Label,
          address: formData.salePoint1Address,
          description: formData.salePoint1Description || null,
          latitude: formData.salePoint1Lat || null,
          longitude: formData.salePoint1Lng || null,
          is_primary: true,
        });
      }

      if (formData.salePoint2Label && formData.salePoint2Address) {
        salePointsToInsert.push({
          fisherman_id: fishermanData.id,
          label: formData.salePoint2Label,
          address: formData.salePoint2Address,
          description: formData.salePoint2Description || null,
          latitude: formData.salePoint2Lat || null,
          longitude: formData.salePoint2Lng || null,
          is_primary: false,
        });
      }

      if (salePointsToInsert.length > 0) {
        const { error: salePointsError } = await supabase
          .from('fisherman_sale_points')
          .insert(salePointsToInsert);

        if (salePointsError) throw salePointsError;
      }

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
        {/* Bouton Quitter */}
        <div className="flex justify-end mb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <X className="h-4 w-4 mr-2" />
                Quitter
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Quitter le formulaire ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vos données actuelles seront sauvegardées. Vous pourrez revenir plus tard pour continuer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => navigate('/dashboard/pecheur')}>
                  Quitter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

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
          {currentStep === 6 && (
            <Step6PointsVente formData={formData} onChange={handleFieldChange} />
          )}

          {/* Port file info */}
          {portFile && currentStep === 1 && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <p className="font-medium text-sm mb-2">
                Ports disponibles (
                {basin === 'MEDITERRANEE'
                  ? 'Méditerranée'
                  : basin === 'MANCHE'
                  ? 'Manche'
                  : 'Atlantique'}
                )
              </p>
              <a
                href={portFile}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline text-sm hover:text-primary/80"
              >
                Ouvrir la liste des ports
              </a>
            </div>
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

            {currentStep < 6 ? (
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