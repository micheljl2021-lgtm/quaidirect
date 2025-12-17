import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Crown, Mail, Star, Bell, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    name: 'Follower',
    price: 'Gratuit',
    badge: null,
    icon: Bell,
    features: [
      'Voir les arrivages publics',
      'Suivre 2 pêcheurs',
      '1 port favori (rayon 10km)',
      'Notifications Push',
    ],
    cta: 'Créer un compte',
    ctaVariant: 'outline' as const,
    href: '/auth',
  },
  {
    name: 'Premium',
    price: '2,50€/mois',
    badge: 'Recommandé',
    icon: Crown,
    features: [
      'Tout Follower +',
      'Badge Premium customisé',
      '📧 Email sur 2 points de vente',
      '⚡ Accès anticipé 30min',
    ],
    cta: 'Découvrir Premium',
    ctaVariant: 'default' as const,
    href: '/premium',
  },
  {
    name: 'Premium+',
    price: '4€/mois',
    badge: 'Gros débit',
    icon: Star,
    features: [
      'Tout Premium +',
      '📧 Email sur 5 points de vente',
      '🐟 Suivre 10 espèces favorites',
      '💰 Cagnotte SMS pêcheurs',
    ],
    cta: 'Découvrir Premium+',
    ctaVariant: 'default' as const,
    href: '/premium',
  },
];

export const PremiumCardsSection = () => (
  <section className="container px-4 py-16 bg-gradient-to-b from-primary/5 to-transparent rounded-xl">
    <div className="mx-auto max-w-5xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-premium/10 border border-premium/20 mb-4">
          <Crown className="h-4 w-4 text-premium" aria-hidden="true" />
          <span className="text-sm font-medium text-premium-foreground">Plans Premium</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Soutenez vos pêcheurs préférés
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Accédez à plus de fonctionnalités et soutenez la pêche artisanale
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const IconComponent = plan.icon;
          return (
            <Card
              key={plan.name}
              className={
                plan.badge === 'Recommandé' 
                  ? 'border-primary border-2 shadow-lg relative' 
                  : 'border-border'
              }
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  {plan.badge}
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-2xl font-bold text-primary mt-2">
                  {plan.price}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.href} className="block">
                  <Button
                    className="w-full mt-4"
                    variant={plan.ctaVariant}
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
