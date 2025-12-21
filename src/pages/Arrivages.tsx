import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArrivageCard from '@/components/ArrivageCard';
import { ArrivageCardSkeletonGrid } from '@/components/ArrivageCardSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Fish, Filter, MapPin, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSalePoints } from '@/hooks/useSalePoints';
import { useQuery } from '@tanstack/react-query';
import { LIMITS } from '@/lib/constants';
import { useFishermanZone } from '@/hooks/useFishermanZone';

interface Drop {
  id: string;
  port_id: string;
  fisherman_id: string;
  sale_point_id?: string | null;
  eta_at: string | null;
  sale_start_time: string | null;
  visible_at: string;
  public_visible_at: string | null;
  is_premium: boolean;
  ports: {
    id?: string;
    name: string;
    city: string;
  } | null;
  fishermen: {
    id: string;
    boat_name: string;
    company_name: string | null;
    display_name_preference: string | null;
    photo_url: string | null;
    main_fishing_zone: string | null;
    is_ambassador?: boolean;
    slug?: string;
  } | null;
  drop_photos?: Array<{
    id: string;
    photo_url: string;
    display_order: number;
  }>;
  drop_species?: Array<{
    id: string;
    species: {
      id: string;
      name: string;
      scientific_name: string | null;
    };
  }>;
  offers?: Array<{
    id: string;
    title: string;
    unit_price: number;
    available_units: number;
    species: {
      id: string;
      name: string;
      scientific_name: string | null;
    };
    offer_photos: Array<{
      photo_url: string;
      display_order: number;
    }>;
  }>;
}

const Arrivages = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { fishermanZone, isFisherman } = useFishermanZone();
  
  // Toggle "Ma zone / Partout" - par défaut sur "Ma zone" pour les pêcheurs
  const [showMyZoneOnly, setShowMyZoneOnly] = useState(true);
  
  // États pour les filtres
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [filterPort, setFilterPort] = useState<string>('all');
  const [filterFisherman, setFilterFisherman] = useState<string>('all');

  // Synchroniser le filtre pêcheur avec l'URL
  useEffect(() => {
    const fishermanParam = searchParams.get('fisherman');
    if (fishermanParam) {
      setFilterFisherman(fishermanParam);
    }
  }, [searchParams]);

  // Anonymous users can now view this page - no redirect needed
  // RLS policies on drops table handle visibility filtering

  useEffect(() => {
    // Update current time every 60 seconds for countdown display
    // (1 second was excessive for data that changes slowly)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch sale points via centralized hook (cached 10 min) - only if user is authenticated
  const { data: salePoints } = useSalePoints({ enabled: !!user });

  // Fetch drops with RLS enforced server-side (without sale points join)
  // Enabled for all users (anonymous get public drops via RLS)
  const { data: drops, isLoading, error } = useQuery({
    queryKey: ['drops', user?.id ?? 'anonymous'],
    enabled: true, // Always fetch - RLS handles visibility
    queryFn: async () => {
      // Grace period: show arrivals up to X hours after their sale_start_time
      const graceMs = LIMITS.ARRIVAL_GRACE_HOURS * 60 * 60 * 1000;
      const minStartTime = new Date(Date.now() - graceMs).toISOString();

      const { data, error } = await supabase
        .from('drops')
        .select(`
          *,
          fishermen:public_fishermen!fisherman_id (
            id,
            boat_name,
            company_name,
            display_name_preference,
            photo_url,
            main_fishing_zone,
            is_ambassador,
            slug
          ),
          ports (
            id,
            name,
            city
          ),
          fisherman_sale_points (
            id,
            label,
            address
          ),
          drop_photos (
            id,
            photo_url,
            display_order
          ),
          drop_species (
            id,
            species (
              id,
              name,
              scientific_name
            )
          ),
          offers (
            id,
            title,
            unit_price,
            available_units,
            species (
              id,
              name,
              scientific_name
            ),
            offer_photos (
              photo_url,
              display_order
            )
          )
        `)
        .in('status', ['scheduled', 'landed'])
        .gte('sale_start_time', minStartTime)
        .order('sale_start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every 60 seconds (reduced from 30s)
    staleTime: 30 * 1000, // 30 seconds stale time for drops
  });

  // Set up realtime subscription for drops
  useEffect(() => {
    const channel = supabase
      .channel('drops-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drops',
        },
        () => {
          // Refetch when drops change
          queryClient.invalidateQueries({ queryKey: ['drops'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const getTimeUntil = (date: Date) => {
    const diff = date.getTime() - currentTime.getTime();
    if (diff < 0) return 'Maintenant';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
    
    return `${minutes}min ${seconds}s`;
  };

  const getAccessBadge = (drop: Drop) => {
    const isPremiumUser = userRole === 'premium';
    const visibleAt = new Date(drop.visible_at);
    const publicVisibleAt = drop.public_visible_at 
      ? new Date(drop.public_visible_at)
      : new Date(visibleAt.getTime() + 30 * 60000); // Default: 30 min after visible_at
    
    // If user can see it and is premium, and it's not yet public
    if (isPremiumUser && currentTime < publicVisibleAt) {
      return (
        <Badge className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500">
          ⭐ Accès Premium
        </Badge>
      );
    }
    
    return null;
  };

  const handleReserve = useCallback((offerId: string) => {
    toast({
      title: 'Réservation',
      description: 'Fonctionnalité de réservation bientôt disponible',
    });
  }, [toast]);

  // Memoized reset filters function
  const resetFilters = useCallback(() => {
    setFilterZone('all');
    setFilterSpecies('all');
    setFilterPort('all');
    setFilterFisherman('all');
  }, []);

  // Extraire les options uniques pour les filtres
  const uniqueZones = useMemo(() => {
    if (!drops) return [];
    const zones = drops
      .map(d => d.fishermen?.main_fishing_zone)
      .filter((zone): zone is string => !!zone);
    return Array.from(new Set(zones));
  }, [drops]);

  const uniqueSpecies = useMemo(() => {
    if (!drops) return [];
    const speciesMap = new Map<string, string>();
    drops.forEach(d => {
      // Get species from offers first
      d.offers?.forEach(o => {
        if (o && o.species?.id && o.species?.name) {
          speciesMap.set(o.species.id, o.species.name);
        }
      });
      // Fallback to drop_species if no offers
      d.drop_species?.forEach(ds => {
        if (ds.species?.id && ds.species?.name) {
          speciesMap.set(ds.species.id, ds.species.name);
        }
      });
    });
    return Array.from(speciesMap, ([id, name]) => ({ id, name }));
  }, [drops]);

  const uniquePorts = useMemo(() => {
    if (!drops || !salePoints) return [];
    const locations = drops
      .map(d => {
        if (d.ports?.id) {
          return { id: d.ports.id, name: `${d.ports.name}, ${d.ports.city}` };
        } else if (d.sale_point_id) {
          const salePoint = salePoints.find((sp: any) => sp.id === d.sale_point_id);
          if (salePoint) {
            return { id: salePoint.id, name: salePoint.address || salePoint.label };
          }
        }
        return null;
      })
      .filter(Boolean);
    const uniqueMap = new Map(locations.map(p => [p.id, p.name]));
    return Array.from(uniqueMap, ([id, name]) => ({ id, name }));
  }, [drops, salePoints]);

  const uniqueFishermen = useMemo(() => {
    if (!drops) return [];
    const fishermen = drops
      .filter(d => d.fishermen?.id)
      .map(d => ({
        id: d.fishermen!.id,
        name: d.fishermen!.display_name_preference === 'company_name'
          ? (d.fishermen!.company_name || d.fishermen!.boat_name)
          : d.fishermen!.boat_name
      }));
    const uniqueMap = new Map(fishermen.map(f => [f.id, f.name]));
    return Array.from(uniqueMap, ([id, name]) => ({ id, name }));
  }, [drops]);

  // Appliquer les filtres
  const filteredDrops = useMemo(() => {
    if (!drops) return [];
    return drops.filter(drop => {
      // Filtre "Ma zone" pour les pêcheurs (prioritaire)
      if (isFisherman && showMyZoneOnly && fishermanZone) {
        if (drop.fishermen?.main_fishing_zone !== fishermanZone) {
          return false;
        }
      }
      
      // Filtre zone manuel (seulement si "Partout" est activé ou si pas pêcheur)
      if (!showMyZoneOnly || !isFisherman) {
        if (filterZone !== 'all' && drop.fishermen?.main_fishing_zone !== filterZone) {
          return false;
        }
      }
      
      // Filtre espèce - check both offers and drop_species
      if (filterSpecies !== 'all') {
        const hasSpeciesInOffers = drop.offers?.some(o => o.species && o.species.id === filterSpecies);
        const hasSpeciesInDropSpecies = drop.drop_species?.some(ds => ds.species?.id === filterSpecies);
        if (!hasSpeciesInOffers && !hasSpeciesInDropSpecies) return false;
      }
      
      // Filtre port - Prendre en compte port_id ET sale_point_id
      if (filterPort !== 'all') {
        const matchesPort = drop.ports?.id === filterPort;
        const matchesSalePoint = drop.sale_point_id === filterPort;
        if (!matchesPort && !matchesSalePoint) {
          return false;
        }
      }
      
      // Filtre pêcheur
      if (filterFisherman !== 'all' && drop.fishermen?.id !== filterFisherman) {
        return false;
      }
      
      return true;
    });
  }, [drops, filterZone, filterSpecies, filterPort, filterFisherman, isFisherman, showMyZoneOnly, fishermanZone]);

  // Show loading state while loading data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <ArrivageCardSkeletonGrid count={6} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Arrivages à venir</h1>
          <p className="text-muted-foreground">
            {userRole === 'premium' ? (
              <span className="flex items-center gap-2">
                ⭐ <strong>Accès Premium</strong> : Vous voyez les arrivages 30 min avant tout le monde
              </span>
            ) : (
              'Découvrez les prochains arrivages de poisson frais'
            )}
          </p>
        </div>

        {/* Toggle Ma zone / Partout pour les pêcheurs */}
        {isFisherman && fishermanZone && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showMyZoneOnly ? (
                    <MapPin className="h-5 w-5 text-primary" />
                  ) : (
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {showMyZoneOnly ? 'Ma zone' : 'Toutes les zones'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {showMyZoneOnly 
                        ? `Arrivages en ${fishermanZone}`
                        : 'Voir tous les arrivages de France'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Partout</span>
                  <Switch 
                    checked={showMyZoneOnly}
                    onCheckedChange={setShowMyZoneOnly}
                  />
                  <span className="text-sm text-muted-foreground">Ma zone</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtres */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" aria-hidden="true" />
              Filtres
            </CardTitle>
            <CardDescription>
              Affinez votre recherche d'arrivages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtre Zone - désactivé si "Ma zone" est actif */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Zone de pêche</label>
                <Select 
                  value={isFisherman && showMyZoneOnly ? 'all' : filterZone} 
                  onValueChange={setFilterZone}
                  disabled={isFisherman && showMyZoneOnly}
                >
                  <SelectTrigger className={`z-50 ${isFisherman && showMyZoneOnly ? 'opacity-50' : ''}`}>
                    <SelectValue placeholder="Toutes les zones" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Toutes les zones</SelectItem>
                    {uniqueZones.map(zone => (
                      <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Espèce */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Espèce</label>
                <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                  <SelectTrigger className="z-50">
                    <SelectValue placeholder="Toutes les espèces" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Toutes les espèces</SelectItem>
                    {uniqueSpecies.map(species => (
                      <SelectItem key={species.id} value={species.id}>{species.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Port */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Port</label>
                <Select value={filterPort} onValueChange={setFilterPort}>
                  <SelectTrigger className="z-50">
                    <SelectValue placeholder="Tous les ports" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Tous les ports</SelectItem>
                    {uniquePorts.map(port => (
                      <SelectItem key={port.id} value={port.id}>{port.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Pêcheur */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pêcheur</label>
                <Select 
                  value={filterFisherman} 
                  onValueChange={setFilterFisherman}
                  disabled={uniqueFishermen.length === 0}
                >
                  <SelectTrigger className="z-50">
                    <SelectValue placeholder={uniqueFishermen.length === 0 ? "Aucun pêcheur" : "Tous les pêcheurs"} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Tous les pêcheurs</SelectItem>
                    {uniqueFishermen.map(fisherman => (
                      <SelectItem key={fisherman.id} value={fisherman.id}>{fisherman.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {uniqueFishermen.length === 0 && drops && drops.length > 0 && (
                  <p className="text-xs text-muted-foreground">Données pêcheurs en chargement...</p>
                )}
              </div>
            </div>

            {/* Compteur de résultats et reset */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {filteredDrops.length} arrivage{filteredDrops.length > 1 ? 's' : ''} trouvé{filteredDrops.length > 1 ? 's' : ''}
              </p>
              {(filterZone !== 'all' || filterSpecies !== 'all' || filterPort !== 'all' || filterFisherman !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statut utilisateur */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Votre statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type de compte</span>
              <Badge variant={userRole === 'premium' ? 'default' : 'secondary'}>
                {userRole === 'premium' ? '⭐ Premium' : 'Gratuit'}
              </Badge>
            </div>
            {userRole !== 'premium' && (
              <Button className="w-full mt-4" onClick={() => window.location.href = '/premium'}>
                Passer Premium pour voir en avant-première
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Loading state with skeleton */}
        {isLoading && (
          <ArrivageCardSkeletonGrid count={6} />
        )}

        {/* Error state */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">
                Erreur lors du chargement des arrivages. Veuillez réessayer.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredDrops && filteredDrops.length === 0 && drops && drops.length > 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Fish className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
              <p className="text-muted-foreground">
                Aucun arrivage ne correspond à vos critères.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Essayez de modifier vos filtres ci-dessus.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && drops && drops.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12 space-y-4">
              <Fish className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
              <p className="text-lg font-medium text-foreground">
                Aucun arrivage prévu pour le moment
              </p>
              <p className="text-sm text-muted-foreground">
                Les pêcheurs publient leurs arrivages régulièrement. Revenez bientôt ou inscrivez-vous aux alertes pour ne rien manquer !
              </p>
              {!user && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button onClick={() => navigate('/auth')}>
                    Créer un compte gratuit
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/premium')}>
                    Découvrir Premium
                  </Button>
                </div>
              )}
              {user && userRole !== 'premium' && (
                <Button onClick={() => navigate('/premium')}>
                  Passer Premium pour être alerté en priorité
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Liste des drops */}
        <div className="space-y-4">
        {filteredDrops?.map((drop) => {
            const etaDate = drop.eta_at ? new Date(drop.eta_at) : null;
            const saleDate = drop.sale_start_time ? new Date(drop.sale_start_time) : null;
            
            // Joindre côté client les sale points (chargés via Edge Function)
            const salePoint = salePoints?.find((sp: any) => sp.id === drop.sale_point_id);
            // Utiliser le label du point de vente depuis la jointure Supabase
            const salePointLabel = drop.fisherman_sale_points?.label || salePoint?.label || null;
            const portName = drop.ports?.name 
              ? `${drop.ports.name}, ${drop.ports.city}` 
              : (salePoint?.address || salePointLabel || 'Point de vente');
            
            const displayName = drop.fishermen?.display_name_preference === 'company_name'
              ? (drop.fishermen?.company_name || drop.fishermen?.boat_name || 'Pêcheur')
              : (drop.fishermen?.boat_name || 'Pêcheur');
            
            // Pour chaque drop, créer une card par offre (ou une seule si pas d'offres)
            if (drop.offers && drop.offers.length > 0) {
              // Filtrer les offres avec species valide
              const validOffers = drop.offers.filter(offer => offer.species && offer.species.id);
              
              if (validOffers.length > 0) {
                return validOffers.map((offer) => (
                  <div key={`${drop.id}-${offer.id}`} className="cursor-pointer" onClick={() => handleReserve(offer.id)}>
                    <ArrivageCard
                      id={drop.id}
                      salePointLabel={salePointLabel}
                      species={offer.species.name}
                      scientificName={offer.species.scientific_name || ''}
                      port={portName}
                      eta={etaDate || saleDate!}
                      saleStartTime={saleDate}
                      pricePerPiece={offer.unit_price}
                      quantity={offer.available_units}
                      isPremium={drop.is_premium}
                      dropPhotos={drop.drop_photos}
                      fisherman={{
                        id: drop.fishermen?.id,
                        slug: drop.fishermen?.slug,
                        name: displayName,
                        boat: drop.fishermen?.boat_name || 'Bateau',
                        isAmbassador: drop.fishermen?.is_ambassador
                      }}
                    />
                  </div>
                ));
              }
            }
            
            // Fallback: use drop_species if no offers
            const allSpecies = drop.drop_species?.map(ds => ds.species?.name).filter(Boolean) || [];
            const speciesName = allSpecies.length > 0 ? allSpecies.join(', ') : 'Arrivage du jour';
            const speciesFromDropSpecies = drop.drop_species?.[0]?.species;
            const scientificName = speciesFromDropSpecies?.scientific_name || '';
            
            // Si pas d'offres valides, afficher quand même le drop avec drop_species
            return (
              <div key={drop.id}>
                <ArrivageCard
                  id={drop.id}
                  salePointLabel={salePointLabel}
                  species={speciesName}
                  scientificName={scientificName}
                  port={portName}
                  eta={etaDate || saleDate!}
                  saleStartTime={saleDate}
                  pricePerPiece={undefined}
                  quantity={0}
                  isPremium={drop.is_premium}
                  dropPhotos={drop.drop_photos}
                  fisherman={{
                    id: drop.fishermen?.id,
                    slug: drop.fishermen?.slug,
                    name: displayName,
                    boat: drop.fishermen?.boat_name || 'Bateau',
                    isAmbassador: drop.fishermen?.is_ambassador
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Arrivages;
