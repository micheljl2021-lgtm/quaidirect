import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Package, Users, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  fish_quota: number;
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  remaining_quota: number;
  start_date: string;
  end_date: string;
  status: string;
  package: SubscriptionPackage;
}

const Panier = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
    if (user) {
      loadUserSubscription();
    }
  }, [user]);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement du panier");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_package_subscriptions")
        .select(`
          *,
          package:package_id (*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setUserSubscription(data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleSubscribe = async (packageId: string, durationDays: number, quota: number) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour souscrire");
      return;
    }

    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { error } = await supabase
        .from("user_package_subscriptions")
        .insert({
          user_id: user.id,
          package_id: packageId,
          remaining_quota: quota,
          end_date: endDate.toISOString(),
          status: "active",
        });

      if (error) throw error;

      toast.success("Panier souscrit avec succès!");
      loadUserSubscription();
    } catch (error: any) {
      toast.error("Erreur lors de la souscription");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Panier Poisson Frais
            </h1>
            <p className="text-lg text-muted-foreground">
              Économisez avec nos paniers hebdomadaires et mensuels
            </p>
          </div>
        </div>

        {userSubscription && (
          <Card className="mb-8 max-w-2xl mx-auto border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Votre panier actif
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {userSubscription.package.name}
                  </p>
                </div>
                <Badge className="bg-green-500">Actif</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Poissons restants</span>
                <span className="text-2xl font-bold text-primary">
                  {userSubscription.remaining_quota}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expire le</span>
                <span className="font-medium">
                  {new Date(userSubscription.end_date).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className="relative overflow-hidden hover:shadow-lg transition-shadow"
            >
              {pkg.fish_quota >= 8 && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-ocean">
                    Populaire
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center space-y-2 pt-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {pkg.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pkg.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">
                    {pkg.price.toFixed(2)}€
                  </div>
                  <div className="text-sm text-muted-foreground">
                    pour {pkg.duration_days === 7 ? "1 semaine" : "1 mois"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm">
                      <strong>{pkg.fish_quota}</strong> poissons inclus
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Prix unitaire réduit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Choix libre des espèces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Qualité garantie</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(pkg.id, pkg.duration_days, pkg.fish_quota)}
                  disabled={!!userSubscription}
                >
                  {userSubscription ? "Déjà abonné" : "Souscrire"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Programme de parrainage */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-gradient-ocean text-white overflow-hidden">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center">
                    <Gift className="h-12 w-12" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">
                    Parrainez et gagnez!
                  </h3>
                  <p className="text-white/90 mb-4">
                    Invitez un ami ou un pêcheur professionnel et recevez tous les deux
                    <strong> 10€ de bonus</strong> dès la première commande.
                  </p>
                  <Button
                    variant="secondary"
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Parrainer maintenant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Panier;
