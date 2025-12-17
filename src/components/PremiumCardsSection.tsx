import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star, Bell, MessageSquare, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    name: 'Follower',
    price: 'Gratuit',
    badge: null,
    icon: Bell,
    features: [
      'Voir les arrivages publics',
      'Suivre 2 pêcheurs favoris',
      '1 port favori (rayon 10km)',
      '🔔 Notifications Push',
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
      '✨ Badge Premium personnalisé',
      '📧 Emails : arrivages, espèces, points de vente',
      '🎣 Choisir un pêcheur à soutenir',
      '🔔 Choix : Push ou Email',
    ],
    cta: 'Découvrir Premium',
    ctaVariant: 'default' as const,
    href: '/premium',
  },
  {
    name: 'Premium+',
    price: '4€/mois',
    badge: 'SMS inclus',
    icon: Star,
    features: [
      'Tout Premium +',
      '📱 Alertes SMS en plus',
      '📧 Email sur 5 points de vente',
      '🐟 Suivre 10 espèces favorites',
      '🔔 Choix : Push / Email / SMS',
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
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Soutenez les marins pêcheurs artisans
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Inscrivez-vous et recevez une alerte dès qu'ils débarquent leur pêche
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
                  : plan.badge === 'SMS inclus'
                  ? 'border-2 border-amber-500/50 shadow-lg relative bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20'
                  : 'border-border'
              }
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.badge === 'SMS inclus' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {plan.badge}
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-3 ${
                  plan.name === 'Premium+' ? 'bg-amber-100 dark:bg-amber-950/50' : 'bg-primary/10'
                }`}>
                  <IconComponent className={`h-6 w-6 ${plan.name === 'Premium+' ? 'text-amber-500' : 'text-primary'}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className={`text-2xl font-bold mt-2 ${plan.name === 'Premium+' ? 'text-amber-600' : 'text-primary'}`}>
                  {plan.price}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.name === 'Premium+' ? 'text-amber-500' : 'text-green-500'}`} />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.href} className="block">
                  <Button
                    className={`w-full mt-4 ${plan.name === 'Premium+' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' : ''}`}
                    variant={plan.name === 'Premium+' ? 'default' : plan.ctaVariant}
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
