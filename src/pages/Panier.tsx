import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Package, ShoppingBasket, Users, Gift } from "lucide-react";
import { toast } from "sonner";

const PANIERS = [
  {
    id: 'decouverte',
    name: 'Panier Découverte',
    price: 25,
    weight: '~1.5kg',
    variety: '2-3 espèces',
    description: 'Parfait pour découvrir la pêche locale',
    features: [
      'Environ 1.5kg de poissons frais',
      '2 à 3 espèces différentes selon arrivage',
      'Poissons de saison',
      'Conseils de préparation inclus'
    ],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'famille',
    name: 'Panier Famille',
    price: 45,
    weight: '~3kg',
    variety: '4-5 espèces',
    description: 'Idéal pour les repas en famille',
    popular: true,
    features: [
      'Environ 3kg de poissons frais',
      '4 à 5 espèces variées',
      'Mélange de poissons nobles et courants',
      'Recettes suggérées incluses',
      'Conseils de conservation'
    ],
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'gourmet',
    name: 'Panier Gourmet',
    price: 75,
    weight: '~4kg',
    variety: 'Espèces premium',
    description: 'Pour les amateurs de qualité exceptionnelle',
    features: [
      'Environ 4kg de poissons premium',
      'Espèces nobles et recherchées',
      'Sélection du pêcheur',
      'Préparation spéciale possible',
      'Recettes gastronomiques',
      'Service prioritaire'
    ],
    color: 'from-purple-500 to-pink-500'
  }
];

const Panier = () => {
  const navigate = useNavigate();

  const handleOrderPanier = (panierId: string, panierName: string) => {
    toast.info(`Fonctionnalité en cours de développement : ${panierName}`);
    // TODO: Implémenter la commande de panier
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="flex justify-center mb-4">
              <ShoppingBasket className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Nos Paniers de Poissons Frais
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Des paniers préparés avec soin par nos pêcheurs partenaires.
              Poissons ultra-frais, pêchés le jour même ou la veille.
            </p>
          </div>

          {/* Avantages */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Composition Variable</h3>
                <p className="text-sm text-muted-foreground">
                  Le contenu des paniers varie selon les arrivages du jour pour garantir la fraîcheur
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Direct Pêcheur</h3>
                <p className="text-sm text-muted-foreground">
                  Achetez directement aux pêcheurs, sans intermédiaire, pour une rémunération équitable
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Gift className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Sur Mesure</h3>
                <p className="text-sm text-muted-foreground">
                  Possibilité d'adapter les paniers selon vos préférences et allergies
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Paniers */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {PANIERS.map((panier) => (
              <Card 
                key={panier.id} 
                className={`relative overflow-hidden ${panier.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}
              >
                {panier.popular && (
                  <Badge className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-amber-500">
                    Le plus populaire
                  </Badge>
                )}
                
                <CardHeader>
                  <div className={`h-32 -mx-6 -mt-6 mb-4 bg-gradient-to-br ${panier.color} rounded-t-lg flex items-center justify-center`}>
                    <ShoppingBasket className="h-16 w-16 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{panier.name}</CardTitle>
                  <CardDescription>{panier.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <div className="text-4xl font-bold">{panier.price}€</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {panier.weight} • {panier.variety}
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {panier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full"
                    size="lg"
                    variant={panier.popular ? "default" : "outline"}
                    onClick={() => handleOrderPanier(panier.id, panier.name)}
                  >
                    Commander ce panier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Informations pratiques */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="font-semibold mb-2">1. Commandez</div>
                  <p className="text-sm text-muted-foreground">
                    Choisissez votre panier et validez votre commande en ligne
                  </p>
                </div>
                <div>
                  <div className="font-semibold mb-2">2. Récupération</div>
                  <p className="text-sm text-muted-foreground">
                    Retirez votre panier directement au point de vente du pêcheur
                  </p>
                </div>
                <div>
                  <div className="font-semibold mb-2">3. Dégustez</div>
                  <p className="text-sm text-muted-foreground">
                    Savourez des poissons ultra-frais pêchés par des professionnels
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-300">
                <p className="text-sm text-muted-foreground">
                  <strong>Bon à savoir :</strong> Les paniers sont préparés selon les arrivages du jour.
                  La composition exacte peut varier mais la qualité et la fraîcheur sont toujours garanties.
                  Venez avec un contenant isotherme pour une conservation optimale.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Final */}
          <div className="text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Pas encore inscrit ?</h2>
            <p className="text-muted-foreground mb-6">
              Créez votre compte pour commander vos paniers et suivre vos pêcheurs favoris
            </p>
            <Button size="lg" onClick={() => navigate('/auth')}>
              Créer mon compte gratuitement
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Panier;
