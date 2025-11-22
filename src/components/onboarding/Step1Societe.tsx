import { Building2, Loader2, RefreshCw, Ship } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step1SocieteProps {
  formData: {
    siret: string;
    boatName: string;
    ownerName: string;
    companyName: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string;
    email: string;
  };
  onChange: (field: string, value: string) => void;
}

export function Step1Societe({ formData, onChange }: Step1SocieteProps) {
  const [loading, setLoading] = useState(false);

  const handleSiretLookup = async () => {
    if (!formData.siret || formData.siret.length !== 14) {
      toast.error("Le SIRET doit contenir 14 chiffres");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-company-info', {
        body: { siret: formData.siret }
      });

      if (error) throw error;

      if (data) {
        onChange('companyName', data.name || '');
        onChange('address', data.address || '');
        onChange('city', data.city || '');
        onChange('postalCode', ''); // API Entreprise ne retourne pas toujours le code postal
        toast.success("Informations récupérées avec succès !");
      }
    } catch (error) {
      console.error('Erreur récupération SIRET:', error);
      toast.error("Impossible de récupérer les informations du SIRET");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Informations société</h2>
        <p className="text-muted-foreground">Commençons par les informations de base</p>
      </div>

      {/* SIRET Lookup */}
      <div className="space-y-2">
        <Label htmlFor="siret">SIRET* <span className="text-xs text-muted-foreground">(14 chiffres)</span></Label>
        <div className="flex gap-2">
          <Input
            id="siret"
            value={formData.siret}
            onChange={(e) => onChange('siret', e.target.value.replace(/\D/g, '').slice(0, 14))}
            placeholder="12345678901234"
            maxLength={14}
            required
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSiretLookup}
            disabled={loading || formData.siret.length !== 14}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Récupérer
          </Button>
        </div>
      </div>

      {/* Boat Name */}
      <div className="space-y-2">
        <Label htmlFor="boatName" className="flex items-center gap-2">
          <Ship className="w-4 h-4" />
          Nom du bateau*
        </Label>
        <Input
          id="boatName"
          value={formData.boatName}
          onChange={(e) => onChange('boatName', e.target.value)}
          placeholder="Ex: L'Étoile des Mers"
          required
        />
      </div>

      {/* Owner Name */}
      <div className="space-y-2">
        <Label htmlFor="ownerName">Nom du marin pêcheur / Société*</Label>
        <Input
          id="ownerName"
          value={formData.ownerName}
          onChange={(e) => onChange('ownerName', e.target.value)}
          placeholder="Ex: Jean Dupont"
          required
        />
      </div>

      {/* Company Name (auto-filled) */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Raison sociale</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          placeholder="Complété automatiquement via SIRET"
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Complété automatiquement via le SIRET</p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Adresse*</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Ex: 12 Quai des Pêcheurs"
          required
        />
      </div>

      {/* Postal Code + City */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode">Code postal*</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => onChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="83400"
            maxLength={5}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville*</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Hyères"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone portable*</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="06 12 34 56 78"
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email*</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="votre.email@exemple.fr"
          required
        />
      </div>
    </div>
  );
}