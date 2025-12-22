import { Camera, Sparkles, Loader2, User } from "lucide-react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhotoUpload } from "@/components/PhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step5PhotosProps {
  formData: {
    profilePhoto: string;
    photoBoat1: string;
    photoBoat2: string;
    photoDockSale: string;
    yearsExperience: string;
    passion: string;
    workStyle: string;
    clientMessage: string;
    generatedDescription: string;
  };
  onChange: (field: string, value: string) => void;
}

export function Step5Photos({ formData, onChange }: Step5PhotosProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDescription = async () => {
    const { yearsExperience, passion, workStyle, clientMessage } = formData;

    if (!yearsExperience || !passion || !workStyle || !clientMessage) {
      toast.error("Veuillez répondre aux 4 questions avant de générer la description");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-fisherman-description', {
        body: {
          yearsExperience,
          passion,
          workStyle,
          clientMessage
        }
      });

      if (error) throw error;

      if (data?.description) {
        onChange('generatedDescription', data.description);
        toast.success("Description générée avec succès !");
      }
    } catch (error: any) {
      console.error('Erreur génération description:', error);
      
      if (error.message?.includes('429')) {
        toast.error("Trop de requêtes. Veuillez réessayer dans un instant.");
      } else if (error.message?.includes('402')) {
        toast.error("Crédits IA épuisés. Contactez le support.");
      } else {
        toast.error("Impossible de générer la description");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Camera className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold">Photos & présentation</h2>
        <p className="text-muted-foreground">Dernière étape : valorisez votre métier</p>
      </div>

      {/* Photos Section */}
      <div className="space-y-6">
        {/* Profile Photo - New! */}
        <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Photo de profil (recommandé)
          </h3>
          <PhotoUpload
            label="Votre photo ou celle de votre équipage"
            value={formData.profilePhoto}
            onChange={(url) => onChange('profilePhoto', url || '')}
            bucket="fishermen-photos"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Cette photo sera affichée sur votre profil public
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Photos de votre bateau (max 2)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhotoUpload
              label="Photo bateau 1"
              value={formData.photoBoat1}
              onChange={(url) => onChange('photoBoat1', url || '')}
              bucket="fishermen-photos"
            />
            <PhotoUpload
              label="Photo bateau 2"
              value={formData.photoBoat2}
              onChange={(url) => onChange('photoBoat2', url || '')}
              bucket="fishermen-photos"
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Photo vente à quai ou avec les clients</h3>
          <PhotoUpload
            label="Une photo conviviale qui montre votre relation avec vos clients"
            value={formData.photoDockSale}
            onChange={(url) => onChange('photoDockSale', url || '')}
            bucket="fishermen-photos"
          />
        </div>
      </div>

      {/* AI Description Section */}
      <div className="space-y-4 p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" aria-hidden="true" />
          <h3 className="font-semibold text-lg">Parlez de vous en quelques mots</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yearsExperience">Depuis quand êtes-vous marin pêcheur ?</Label>
            <Input
              id="yearsExperience"
              value={formData.yearsExperience}
              onChange={(e) => onChange('yearsExperience', e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Ex: 15 ans, toute ma vie, depuis 2010..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passion">Qu'est-ce que vous préférez dans votre métier ?</Label>
            <Textarea
              id="passion"
              value={formData.passion}
              onChange={(e) => onChange('passion', e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Ex: Le contact avec la mer, la liberté, ramener du poisson frais..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workStyle">Comment travaillez-vous ?</Label>
            <Textarea
              id="workStyle"
              value={formData.workStyle}
              onChange={(e) => onChange('workStyle', e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Ex: Respect des saisons, petites quantités, pêche côtière durable..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientMessage">Un message pour vos clients ?</Label>
            <Textarea
              id="clientMessage"
              value={formData.clientMessage}
              onChange={(e) => onChange('clientMessage', e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Ex: Venez découvrir la vraie saveur du poisson frais de Méditerranée..."
              rows={3}
            />
          </div>

          <Button
            type="button"
            onClick={handleGenerateDescription}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                Générer ma description
              </>
            )}
          </Button>
        </div>

        {formData.generatedDescription && (
          <div className="space-y-2 mt-6">
            <Label htmlFor="generatedDescription">Description générée (modifiable)</Label>
            <Textarea
              id="generatedDescription"
              value={formData.generatedDescription}
              onChange={(e) => onChange('generatedDescription', e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              rows={6}
              className="bg-white"
            />
            <p className="text-xs text-muted-foreground">
              Vous pouvez modifier cette description avant de terminer
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
