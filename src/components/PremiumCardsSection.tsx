import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star, Bell, MapPin, Mail, MessageSquare, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

// Tarifs et features alignés avec PremiumPaywall.tsx
const PLANS = [
  {
    name: 'Standard',
    price: 'Gratuit',
    priceDetail: null,
    badge: null,
    icon: Bell,
    features: [
      'Voir les arrivages publics',
      'Suivre 2 pêcheurs favoris',
      'Suivre 1 port préféré (rayon 10km)',
      '🔔 Notifications Push',
    ],
    cta: 'Créer un compte',
    ctaVariant: 'outline' as const,
    href: '/auth',
    isPrimary: false,
    isGold: false,
  },
  {
    name: 'Premium',
    price: '25€/an',
    priceDetail: 'Soit 2,08€/mois',
    badge: 'Populaire',
    icon: Crown,
    features: [
      'Tout Standard inclus',
      '📧 Emails : arrivages, espèces, points de vente',
      '🏪 Suivre 2 points de vente favoris',
      '🐟 Suivre 3 espèces favorites',
      '🔔 Choix : Push ou Email',
      '🎣 Choix d\'un pêcheur favori à soutenir',
    ],
    cta: 'Découvrir Premium',
    ctaVariant: 'default' as const,
    href: '/premium',
    isPrimary: true,
    isGold: false,
  },
  {
    name: 'Premium+',
    price: '40€/an',
    priceDetail: 'Soit 3,33€/mois',
    badge: 'SMS inclus',
    icon: Star,
    features: [
      'Tout Premium inclus',
      '📱 Alertes SMS en plus des emails',
      '🏪 Suivre 5 points de vente favoris',
      '🐟 Suivre 10 espèces favorites',
      '🔔 Choix : Push / Email / SMS',
      '💰 Contribution cagnotte SMS pêcheurs',
    ],
    cta: 'Découvrir Premium+',
    ctaVariant: 'default' as const,
    href: '/premium',
    isPrimary: false,
    isGold: true,
  },
];

export const PremiumCardsSection = () => (
  <section className="container px-4 py-10 md:py-16 bg-gradient-to-b from-primary/5 to-transparent rounded-xl">
    <div className="mx-auto max-w-5xl">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
          Soutenez les marins pêcheurs artisans
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Inscrivez-vous et recevez une alerte dès qu'ils débarquent leur pêche
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {PLANS.map((plan) => {
          const IconComponent = plan.icon;
          return (
            <Card
              key={plan.name}
              className={
                plan.isPrimary 
                  ? 'border-primary border-2 shadow-lg relative mt-4 sm:mt-3' 
                  : plan.isGold
                  ? 'border-2 border-amber-500/50 shadow-lg relative mt-4 sm:mt-3 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20'
                  : 'border-border'
              }
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                  plan.isGold 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {plan.badge}
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-3 ${
                  plan.isGold ? 'bg-amber-100 dark:bg-amber-950/50' : 'bg-primary/10'
                }`}>
                  <IconComponent className={`h-6 w-6 ${plan.isGold ? 'text-amber-500' : 'text-primary'}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <p className={`text-2xl font-bold ${plan.isGold ? 'text-amber-600' : 'text-primary'}`}>
                    {plan.price}
                  </p>
                  {plan.priceDetail && (
                    <p className="text-sm text-primary font-medium mt-1">
                      {plan.priceDetail}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.isGold ? 'text-amber-500' : 'text-green-500'}`} />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.href} className="block">
                  <Button
                    className={`w-full mt-4 ${plan.isGold ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' : ''}`}
                    variant={plan.isGold ? 'default' : plan.ctaVariant}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  </section>
);

export default PremiumCardsSection;
