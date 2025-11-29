import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Lock } from "lucide-react";
import { toast } from "sonner";

export default function SecureProfileEdit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fishermanData, setFishermanData] = useState<any>(null);

  const [formData, setFormData] = useState({
    boat_name: "",
    company_name: "",
    description: "",
    phone: "",
    fishing_methods: [] as string[],
    fishing_zones: [] as string[],
    main_fishing_zone: "",
    photo_url: "",
    photo_boat_1: "",
    photo_boat_2: "",
    photo_dock_sale: "",
    instagram_url: "",
    facebook_url: "",
    website_url: "",
    bio: ""
  });

  useEffect(() => {
    if (!token) {
      setError("Aucun token fourni. Ce lien est invalide.");
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-secure-token", {
        body: { token }
      });

      if (error) throw error;

      if (data.valid) {
        setTokenValid(true);
        setFishermanData(data.fisherman);
        
        // Préremplir le formulaire
        setFormData({
          boat_name: data.fisherman.boat_name || "",
          company_name: data.fisherman.company_name || "",
          description: data.fisherman.description || "",
          phone: data.fisherman.phone || "",
          fishing_methods: data.fisherman.fishing_methods || [],
          fishing_zones: data.fisherman.fishing_zones || [],
          main_fishing_zone: data.fisherman.main_fishing_zone || "",
          photo_url: data.fisherman.photo_url || "",
          photo_boat_1: data.fisherman.photo_boat_1 || "",
          photo_boat_2: data.fisherman.photo_boat_2 || "",
          photo_dock_sale: data.fisherman.photo_dock_sale || "",
          instagram_url: data.fisherman.instagram_url || "",
          facebook_url: data.fisherman.facebook_url || "",
          website_url: data.fisherman.website_url || "",
          bio: data.fisherman.bio || ""
        });
      } else {
        setError(data.error || "Token invalide");
        setTokenValid(false);
      }
    } catch (err: any) {
      console.error("Erreur validation token:", err);
      setError(err.message || "Erreur lors de la validation du lien");
      setTokenValid(false);
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-secure-profile-edit", {
        body: {
          token,
          ...formData
        }
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(true);
        toast.success("Profil mis à jour avec succès !");
        
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (err: any) {
      console.error("Erreur soumission:", err);
      toast.error(err.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validation du lien sécurisé...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Lien invalide ou expiré</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ce lien de modification n'est plus valide. Il a peut-être expiré, déjà été utilisé, ou a été révoqué.
            </p>
            <Button 
              onClick={() => navigate("/pecheur/support")} 
              className="w-full"
            >
              Contacter le support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Profil mis à jour avec succès</CardTitle>
            </div>
            <CardDescription>
              Vos modifications ont bien été enregistrées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Vous allez être redirigé vers la page d'accueil dans quelques secondes...
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Retourner à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Alert className="mb-6 border-primary/50 bg-primary/5">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Lien sécurisé à usage unique</strong> - Ce formulaire est accessible uniquement via le lien que vous avez reçu par email. 
            Les modifications seront enregistrées de manière sécurisée.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Modifier mon profil professionnel</CardTitle>
            <CardDescription>
              Mettez à jour vos informations. Les champs grisés ne peuvent pas être modifiés via ce formulaire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Champs verrouillés (lecture seule) */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Informations non modifiables
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">SIRET</Label>
                    <Input value={fishermanData?.siret || "Non renseigné"} disabled />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">N° Immatriculation</Label>
                    <Input value={fishermanData?.boat_registration || "Non renseigné"} disabled />
                  </div>
                </div>
              </div>

              {/* Champs modifiables */}
              <div className="space-y-4">
                <h3 className="font-semibold">Informations modifiables</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="boat_name">Nom du bateau *</Label>
                    <Input
                      id="boat_name"
                      value={formData.boat_name}
                      onChange={(e) => setFormData({ ...formData, boat_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">Nom de l'entreprise</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="main_fishing_zone">Zone de pêche principale</Label>
                  <Input
                    id="main_fishing_zone"
                    value={formData.main_fishing_zone}
                    onChange={(e) => setFormData({ ...formData, main_fishing_zone: e.target.value })}
                    placeholder="Ex: Méditerranée, Golfe du Lion..."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description courte</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez votre activité en quelques mots..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Présentation détaillée</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Présentez votre parcours, votre philosophie de pêche..."
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instagram_url">Instagram</Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={formData.facebook_url}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website_url">Site web</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les modifications"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={submitting}
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
}
