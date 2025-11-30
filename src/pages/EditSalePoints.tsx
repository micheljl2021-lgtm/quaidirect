import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const SALE_POINT_TYPES = [
  { value: "etal", label: "Étal" },
  { value: "marche", label: "Marché" },
  { value: "vivier", label: "Vivier" },
  { value: "drive", label: "Drive" },
  { value: "autre", label: "Autre" },
];

const EditSalePoints = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salePoint, setSalePoint] = useState<any>(null);
  const [formData, setFormData] = useState({
    label: "",
    type: "etal",
    address: "",
    city: "",
    phone: "",
    schedule: "",
    description: "",
    photo_url: "",
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadSalePoint();
    }
  }, [user, authLoading]);

  const loadSalePoint = async () => {
    try {
      // Récupérer le fisherman_id de l'utilisateur connecté
      const { data: fisherData, error: fisherError } = await supabase
        .from("fishermen")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (fisherError) throw fisherError;

      // Récupérer le point de vente principal
      const { data: salePointData, error: salePointError } = await supabase
        .from("fisherman_sale_points")
        .select("*")
        .eq("fisherman_id", fisherData.id)
        .eq("is_primary", true)
        .single();

      if (salePointData) {
        setSalePoint(salePointData);
        setFormData({
          label: salePointData.label || "",
          type: "etal", // Type non stocké actuellement
          address: salePointData.address || "",
          city: "", // Ville non stockée séparément
          phone: "", // Téléphone non stocké
          schedule: "", // Horaires non stockés
          description: salePointData.description || "",
          photo_url: "", // Photo non stockée
        });
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement du point de vente");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: fisherData } = await supabase
        .from("fishermen")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!fisherData) throw new Error("Pêcheur non trouvé");

      const updateData = {
        label: formData.label,
        address: formData.address,
        description: formData.description,
      };

      if (salePoint) {
        // Mise à jour du point de vente existant
        const { error } = await supabase
          .from("fisherman_sale_points")
          .update(updateData)
          .eq("id", salePoint.id);

        if (error) throw error;
        toast.success("Point de vente mis à jour avec succès");
      } else {
        // Création d'un nouveau point de vente
        const { error } = await supabase
          .from("fisherman_sale_points")
          .insert({
            ...updateData,
            fisherman_id: fisherData.id,
            is_primary: true,
          });

        if (error) throw error;
        toast.success("Point de vente créé avec succès");
      }

      navigate("/dashboard/pecheur");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/pecheur")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {salePoint ? "Modifier mon point de vente" : "Créer mon point de vente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="label">Nom du point de vente *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ex: Étal du Port de Hyères"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de point de vente</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_POINT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ex: Quai Gabriel Péri, 83400 Hyères"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: Hyères"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone de contact</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: 06 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Horaires</Label>
                <Textarea
                  id="schedule"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="Ex: Lundi-Vendredi: 8h-10h, Samedi: 7h-12h"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre point de vente..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo_url">URL de la photo principale</Label>
                <Input
                  id="photo_url"
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/pecheur")}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditSalePoints;
