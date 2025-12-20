import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Clock, 
  Heart, 
  CreditCard, 
  MapPin, 
  Bell, 
  Fish, 
  Anchor,
  FileText,
  HelpCircle,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
  category: 'achat' | 'suivi' | 'paiement' | 'pecheur';
}

// FAQ pour les clients (premium)
const CLIENT_FAQ: FAQItem[] = [
  {
    id: 'commander-panier',
    question: 'Comment commander un panier ?',
    answer: `Pour commander un panier :
1. Rendez-vous sur la page "Arrivages" ou la "Carte"
2. Trouvez un arrivage qui vous intéresse
3. Cliquez sur "Commander un panier"
4. Choisissez votre panier (25€, 45€ ou 75€)
5. Réglez en ligne par carte bancaire
6. Présentez-vous au point de retrait à l'heure indiquée !`,
    icon: <ShoppingCart className="h-4 w-4" />,
    category: 'achat'
  },
  {
    id: 'horaires-vente',
    question: 'Quels sont les horaires de vente ?',
    answer: `Les horaires varient selon les pêcheurs et les arrivages. En général :
• Ventes matinales : 7h-10h (le plus courant)
• Certains proposent des créneaux l'après-midi

Consultez la page "Arrivages" pour voir les créneaux disponibles en temps réel. Vous pouvez aussi suivre vos pêcheurs préférés pour être notifié de leurs prochaines ventes !`,
    icon: <Clock className="h-4 w-4" />,
    category: 'achat'
  },
  {
    id: 'suivre-pecheur',
    question: 'Comment suivre un pêcheur ?',
    answer: `Pour suivre un pêcheur et recevoir ses notifications :
1. Visitez le profil du pêcheur (via un arrivage ou la carte)
2. Cliquez sur le bouton "Suivre"
3. Vous recevrez une notification à chaque nouvel arrivage !

En tant que Premium, vous êtes prioritaire sur les notifications (15 min avant le grand public).`,
    icon: <Heart className="h-4 w-4" />,
    category: 'suivi'
  },
  {
    id: 'modes-paiement',
    question: 'Quels sont les modes de paiement ?',
    answer: `Modes de paiement acceptés :
• Paiement en ligne : Carte bancaire (Visa, Mastercard)
• Paiement sur place : Selon le pêcheur (espèces, CB)

Le paiement en ligne vous garantit la réservation de votre panier. Le paiement sur place est à la discrétion du pêcheur.`,
    icon: <CreditCard className="h-4 w-4" />,
    category: 'paiement'
  },
  {
    id: 'trouver-point-retrait',
    question: 'Où récupérer ma commande ?',
    answer: `Le point de retrait est indiqué sur votre confirmation de commande et sur la page de l'arrivage. C'est généralement :
• Directement sur le quai du port
• À un point de vente défini par le pêcheur

Utilisez la carte interactive pour localiser le point précis. Un lien Google Maps est souvent disponible.`,
    icon: <MapPin className="h-4 w-4" />,
    category: 'achat'
  },
  {
    id: 'notifications-premium',
    question: 'Comment fonctionnent les notifications ?',
    answer: `En tant que membre Premium :
• Notifications prioritaires (15 min avant le public)
• Alertes personnalisées selon vos ports et espèces favoris
• Notifications push sur mobile (si activées)
• Emails récapitulatifs

Configurez vos préférences dans "Mon compte" > "Paramètres Premium".`,
    icon: <Bell className="h-4 w-4" />,
    category: 'suivi'
  }
];

// FAQ pour les pêcheurs
const FISHERMAN_FAQ: FAQItem[] = [
  {
    id: 'creer-arrivage',
    question: 'Comment créer un arrivage ?',
    answer: `Pour publier un arrivage :
1. Depuis le tableau de bord, cliquez sur "Nouvel arrivage"
2. Sélectionnez votre point de vente
3. Indiquez le créneau horaire
4. Ajoutez les espèces (utilisez les presets pour aller plus vite !)
5. Validez et votre arrivage est en ligne !

Astuce : Créez des modèles pour vos arrivages fréquents.`,
    icon: <Fish className="h-4 w-4" />,
    category: 'pecheur'
  },
  {
    id: 'gerer-contacts',
    question: 'Comment gérer mes contacts clients ?',
    answer: `Vos contacts sont dans l'onglet "Contacts" du tableau de bord :
• Importez des contacts depuis un fichier Excel/CSV
• Créez des groupes (particuliers, restos, poissonniers...)
• Envoyez des messages à tous vos contacts ou par groupe

Chaque nouvel arrivage peut déclencher un email automatique à vos contacts.`,
    icon: <FileText className="h-4 w-4" />,
    category: 'pecheur'
  },
  {
    id: 'point-vente',
    question: 'Comment configurer mes points de vente ?',
    answer: `Configurez vos points de vente dans "Paramètres" :
1. Cliquez sur "Points de vente"
2. Ajoutez un nouveau point avec adresse et coordonnées
3. Définissez un point par défaut pour aller plus vite

Chaque point peut avoir une photo et une description pour aider les clients.`,
    icon: <Anchor className="h-4 w-4" />,
    category: 'pecheur'
  },
  {
    id: 'commissions',
    question: 'Comment fonctionnent les commissions ?',
    answer: `Les commissions QuaiDirect :
• 8% sur les paniers vendus en ligne
• Pas de commission sur les ventes directes à quai
• Versement automatique sur votre compte bancaire

Consultez votre "Portefeuille" pour suivre vos revenus et versements.`,
    icon: <CreditCard className="h-4 w-4" />,
    category: 'pecheur'
  },
  {
    id: 'modifier-profil',
    question: 'Comment modifier mon profil public ?',
    answer: `Votre profil public est visible par tous les clients :
1. Allez dans "Mon profil" depuis le tableau de bord
2. Modifiez vos informations (bateau, photos, description...)
3. Ajoutez une citation ou votre philosophie de pêche
4. Les modifications sont visibles immédiatement

Un profil complet inspire confiance et attire plus de clients !`,
    icon: <HelpCircle className="h-4 w-4" />,
    category: 'pecheur'
  }
];

interface FAQSystemProps {
  userType: 'fisherman' | 'premium' | 'admin';
  onAskAI: () => void;
  aiRemaining: number;
  aiLimit: number;
}

export const FAQSystem = ({ userType, onAskAI, aiRemaining, aiLimit }: FAQSystemProps) => {
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null);
  
  const faqItems = userType === 'fisherman' || userType === 'admin' 
    ? [...FISHERMAN_FAQ, ...CLIENT_FAQ.slice(0, 3)] 
    : CLIENT_FAQ;

  const categories = userType === 'fisherman' || userType === 'admin'
    ? [
        { id: 'pecheur', label: 'Pêcheur', color: 'bg-ocean/10 text-ocean' },
        { id: 'achat', label: 'Ventes', color: 'bg-seafoam/10 text-seafoam' },
      ]
    : [
        { id: 'achat', label: 'Acheter', color: 'bg-ocean/10 text-ocean' },
        { id: 'suivi', label: 'Suivre', color: 'bg-seafoam/10 text-seafoam' },
        { id: 'paiement', label: 'Paiement', color: 'bg-coral/10 text-coral' },
      ];

  if (selectedFAQ) {
    return (
      <div className="flex flex-col h-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedFAQ(null)}
          className="self-start mb-3 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            {selectedFAQ.icon}
            <h3 className="font-semibold text-sm">{selectedFAQ.question}</h3>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {selectedFAQ.answer}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Cette réponse ne vous aide pas ?
          </p>
          <Button 
            onClick={onAskAI} 
            className="w-full bg-gradient-ocean"
            disabled={aiLimit > 0 && aiRemaining <= 0}
          >
            Poser ma question à l'IA
            {aiLimit > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {aiRemaining} restantes
              </Badge>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-sm mb-2">Questions fréquentes</h3>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <Badge key={cat.id} variant="outline" className={cat.color}>
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {faqItems.map(faq => (
          <button
            key={faq.id}
            onClick={() => setSelectedFAQ(faq)}
            className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{faq.icon}</span>
                <span className="text-sm font-medium">{faq.question}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground mb-2">
          Vous ne trouvez pas votre réponse ?
        </p>
        <Button 
          onClick={onAskAI} 
          className="w-full bg-gradient-ocean"
          disabled={aiLimit > 0 && aiRemaining <= 0}
        >
          Poser une question à l'IA
          {aiLimit > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {aiRemaining}/{aiLimit} aujourd'hui
            </Badge>
          )}
          {aiLimit === -1 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Illimité
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};
