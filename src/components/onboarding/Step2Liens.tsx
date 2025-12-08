import { Globe, Facebook, Instagram } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Step2LiensProps {
  formData: {
    facebookUrl: string;
    instagramUrl: string;
    websiteUrl: string;
  };
  onChange: (field: string, value: string) => void;
}

export function Step2Liens({ formData, onChange }: Step2LiensProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Globe className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold">Présence en ligne</h2>
        <p className="text-muted-foreground">Partagez vos réseaux sociaux (optionnel mais recommandé)</p>
      </div>

      {/* Alert Box */}
      <Alert className="bg-yellow-50 border-yellow-200">
        <div className="flex gap-2">
          <span className="text-xl">💡</span>
          <div>
            <h4 className="font-semibold mb-1">Pourquoi c'est important ?</h4>
            <AlertDescription>
              Vos liens sociaux permettent aux clients de mieux vous connaître, suivre vos sorties en mer et découvrir votre quotidien de pêcheur. C'est un vrai plus pour la vente directe !
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Facebook */}
      <div className="space-y-2">
        <Label htmlFor="facebookUrl" className="flex items-center gap-2">
          <Facebook className="w-4 h-4 text-blue-600" aria-hidden="true" />
          Page Facebook
        </Label>
        <Input
          id="facebookUrl"
          type="url"
          value={formData.facebookUrl}
          onChange={(e) => onChange('facebookUrl', e.target.value)}
          placeholder="https://facebook.com/votre-page"
        />
        <p className="text-xs text-muted-foreground">Les clients pourront suivre votre actualité et vos arrivages</p>
      </div>

      {/* Instagram */}
      <div className="space-y-2">
        <Label htmlFor="instagramUrl" className="flex items-center gap-2">
          <Instagram className="w-4 h-4 text-pink-600" aria-hidden="true" />
          Compte Instagram
        </Label>
        <Input
          id="instagramUrl"
          type="url"
          value={formData.instagramUrl}
          onChange={(e) => onChange('instagramUrl', e.target.value)}
          placeholder="https://instagram.com/votre-compte"
        />
        <p className="text-xs text-muted-foreground">Partagez vos plus belles photos de pêche</p>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="websiteUrl" className="flex items-center gap-2">
          <Globe className="w-4 h-4" aria-hidden="true" />
          Autre site web
        </Label>
        <Input
          id="websiteUrl"
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => onChange('websiteUrl', e.target.value)}
          placeholder="https://votre-site.fr"
        />
        <p className="text-xs text-muted-foreground">Si vous avez déjà un site personnel ou associatif</p>
      </div>
    </div>
  );
}