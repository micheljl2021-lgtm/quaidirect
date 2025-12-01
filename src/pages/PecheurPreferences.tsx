import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, MapPin, Clock } from "lucide-react";

export default function PecheurPreferences() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salePoints, setSalePoints] = useState<any[]>([]);
  const [defaultSalePointId, setDefaultSalePointId] = useState("");
  const [defaultTimeSlot, setDefaultTimeSlot] = useState("matin");
  const [fishermanId, setFishermanId] = useState("");

  const TIME_SLOTS = [
    { id: "matin", label: "Matin (7h–9h)" },
    { id: "fin_matinee", label: "Fin de matinée (9h–11h)" },
    { id: "midi", label: "Midi (11h–13h)" },
    { id: "apres_midi", label: "Après-midi (14h–17h)" },
  ];

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data: fishermanData, error: fishermanError } = await supabase
        .from("fishermen")
        .select("id, default_sale_point_id, default_time_slot")
        .eq("user_id", user?.id)
        .single();

      if (fishermanError) throw fishermanError;

      setFishermanId(fishermanData.id);
      setDefaultSalePointId(fishermanData.default_sale_point_id || "none");
      setDefaultTimeSlot(fishermanData.default_time_slot || "matin");

      // Load sale points
      const { data: salePointsData, error: salePointsError } = await supabase
        .from("fisherman_sale_points")
        .select("*")
        .eq("fisherman_id", fishermanData.id)
        .order("is_primary", { ascending: false });

      if (salePointsError) throw salePointsError;

      setSalePoints(salePointsData || []);
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Erreur lors du chargement des préférences");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from("fishermen")
        .update({
          default_sale_point_id: defaultSalePointId === "none" ? null : defaultSalePointId,
          default_time_slot: defaultTimeSlot,
        })
        .eq("id", fishermanId);

      if (error) throw error;

      toast.success("Préférences enregistrées !");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-2xl px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/dashboard/pecheur")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Mes préférences</CardTitle>
            <CardDescription>
              Pré-remplis automatiquement tes arrivages avec ces valeurs par défaut
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Default Sale Point */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Point de vente par défaut
              </Label>
              {salePoints.length > 0 ? (
                <Select value={defaultSalePointId} onValueChange={setDefaultSalePointId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un point de vente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun (choisir à chaque fois)</SelectItem>
                    {salePoints.map((point) => (
                      <SelectItem key={point.id} value={point.id}>
                        {point.label} - {point.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Tu n'as pas encore de point de vente configuré.
                    <br />
                    Rends-toi dans la configuration de ta vitrine pour en ajouter.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate("/pecheur/edit-profile")}
                  >
                    Configurer ma vitrine
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Ce point de vente sera présélectionné lors de la création d'arrivages
              </p>
            </div>

            {/* Default Time Slot */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Créneau horaire par défaut
              </Label>
              <Select value={defaultTimeSlot} onValueChange={setDefaultTimeSlot}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ce créneau sera présélectionné par défaut
              </p>
            </div>

            {/* Save Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les préférences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
