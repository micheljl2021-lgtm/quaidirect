import { LucideIcon, Fish, Anchor, MapPin, ShoppingCart, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
}

/**
 * Reusable empty state component for when no data is available
 */
const EmptyState = ({
  icon: Icon = Fish,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = 'default',
}: EmptyStateProps) => {
  const isCompact = variant === 'compact';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'py-8 px-4' : 'py-16 px-6'}`}>
      <div className={`rounded-full bg-muted ${isCompact ? 'p-3 mb-3' : 'p-4 mb-4'}`}>
        <Icon className={`text-muted-foreground ${isCompact ? 'h-6 w-6' : 'h-8 w-8'}`} />
      </div>
      <h3 className={`font-semibold text-foreground ${isCompact ? 'text-base mb-1' : 'text-lg mb-2'}`}>
        {title}
      </h3>
      <p className={`text-muted-foreground max-w-md ${isCompact ? 'text-sm mb-3' : 'text-base mb-4'}`}>
        {description}
      </p>
      {(actionLabel && actionHref) && (
        <Link to={actionHref}>
          <Button variant="default" size={isCompact ? 'sm' : 'default'}>
            {actionLabel}
          </Button>
        </Link>
      )}
      {(actionLabel && onAction && !actionHref) && (
        <Button variant="default" size={isCompact ? 'sm' : 'default'} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const EmptyArrivages = () => (
  <EmptyState
    icon={Anchor}
    title="Aucun arrivage disponible"
    description="Il n'y a pas d'arrivages prévus pour le moment. Revenez bientôt pour découvrir les prochaines pêches !"
    actionLabel="Voir la carte"
    actionHref="/carte"
  />
);

export const EmptyFavorites = () => (
  <EmptyState
    icon={Fish}
    title="Aucun favori"
    description="Vous n'avez pas encore ajouté d'espèces ou de ports favoris. Personnalisez vos préférences pour recevoir des alertes ciblées."
    actionLabel="Gérer mes préférences"
    actionHref="/dashboard/premium"
  />
);

export const EmptyCart = () => (
  <EmptyState
    icon={ShoppingCart}
    title="Votre panier est vide"
    description="Parcourez les arrivages disponibles et réservez vos poissons frais directement auprès des pêcheurs."
    actionLabel="Voir les arrivages"
    actionHref="/arrivages"
  />
);

export const EmptyMessages = () => (
  <EmptyState
    icon={Mail}
    title="Aucun message"
    description="Vous n'avez pas encore de messages. Les échanges avec les pêcheurs apparaîtront ici."
    variant="compact"
  />
);

export const EmptyContacts = () => (
  <EmptyState
    icon={Users}
    title="Aucun contact"
    description="Importez ou ajoutez des contacts pour leur envoyer des notifications d'arrivages."
    actionLabel="Ajouter des contacts"
    actionHref="/pecheur/contacts"
  />
);

export const EmptySalePoints = () => (
  <EmptyState
    icon={MapPin}
    title="Aucun point de vente"
    description="Configurez vos points de vente pour que vos clients sachent où vous trouver."
    variant="compact"
  />
);

export default EmptyState;
