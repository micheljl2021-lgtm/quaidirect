import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type PageStatus = 'loading' | 'invalid' | 'valid' | 'submitting' | 'success';

interface FisherData {
  boat_name: string;
  boat_registration: string;
  siret: string;
  company_name: string;
  description: string;
  phone: string;
  email: string;
  fishing_methods: string[];
  fishing_zones: string[];
  main_fishing_zone: string;
  photo_url: string;
  photo_boat_1: string;
  photo_boat_2: string;
  photo_dock_sale: string;
  instagram_url: string;
  facebook_url: string;
  website_url: string;
  bio: string;
}

const SecureProfileEdit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [status, setStatus] = useState<PageStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [fisherData, setFisherData] = useState<FisherData | null>(null);

  // Form state (only modifiable fields)
  const [formData, setFormData] = useState({
    boat_name: '',
    company_name: '',
    description: '',
    phone: '',
    email: '',
    fishing_methods: [] as string[],
    fishing_zones: [] as string[],
    main_fishing_zone: '',
    photo_url: '',
    photo_boat_1: '',
    photo_boat_2: '',
    photo_dock_sale: '',
    instagram_url: '',
    facebook_url: '',
    website_url: '',
    bio: '',
  });

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Aucun token fourni. Lien invalide.');
        setStatus('invalid');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('validate-secure-token', {
          body: { token },
        });

        if (error) throw error;

        if (!data.valid) {
          setError(data.error || 'Token invalide ou expiré.');
          setStatus('invalid');
          return;
        }

        // Token valide, charger les données du pêcheur
        const fisher = data.fisherman;
        setTokenId(data.tokenId);
        setFisherData(fisher);
        
        // Pré-remplir le formulaire
        setFormData({
          boat_name: fisher.boat_name || '',
          company_name: fisher.company_name || '',
          description: fisher.description || '',
          phone: fisher.phone || '',
          email: fisher.email || '',
          fishing_methods: fisher.fishing_methods || [],
          fishing_zones: fisher.fishing_zones || [],
          main_fishing_zone: fisher.main_fishing_zone || '',
          photo_url: fisher.photo_url || '',
          photo_boat_1: fisher.photo_boat_1 || '',
          photo_boat_2: fisher.photo_boat_2 || '',
          photo_dock_sale: fisher.photo_dock_sale || '',
          instagram_url: fisher.instagram_url || '',
          facebook_url: fisher.facebook_url || '',
          website_url: fisher.website_url || '',
          bio: fisher.bio || '',
        });

        setStatus('valid');
      } catch (e: any) {
        console.error('Error validating token:', e);
        setError(e.message || 'Erreur lors de la validation du token.');
        setStatus('invalid');
      }
    };

    void validateToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    const token = searchParams.get('token');
    if (!token) {
      toast({
        title: 'Erreur',
        description: 'Token manquant.',
        variant: 'destructive',
      });
      setStatus('valid');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('submit-secure-profile-edit', {
        body: {
          token,
          ...formData,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la soumission.');
      }

      toast({
        title: 'Modifications enregistrées',
        description: 'Votre profil a été mis à jour avec succès.',
      });

      setStatus('success');
    } catch (e: any) {
      console.error('Error submitting profile edit:', e);
      toast({
        title: 'Erreur',
        description: e.message || "Impossible d'enregistrer les modifications.",
        variant: 'destructive',
      });
      setStatus('valid');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg font-semibold">Validation du lien sécurisé...</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md space-y-4 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Lien invalide ou expiré</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Ce lien a peut-être expiré (durée de validité de 24h) ou a déjà été utilisé.
          </p>
          <Button onClick={() => navigate('/pecheur/support')}>
            Créer une nouvelle demande
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md space-y-4 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
          <h1 className="text-2xl font-bold">Modifications enregistrées</h1>
          <p className="text-muted-foreground">
            Votre profil a été mis à jour avec succès. Ce lien ne peut plus être utilisé.
          </p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  // Status = 'valid' or 'submitting' - show form
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Modification de votre profil</h1>
          <p className="text-muted-foreground">
            Modifiez les informations de votre profil pêcheur. Les champs marqués "lecture seule" ne peuvent pas être modifiés.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations légales (lecture seule) */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h2 className="text-lg font-semibold">Informations légales (non modifiables)</h2>
            
            <div>
              <Label>SIRET</Label>
              <Input value={fisherData?.siret || ''} disabled className="bg-muted" />
            </div>

            <div>
              <Label>Numéro d'immatriculation du bateau</Label>
              <Input value={fisherData?.boat_registration || ''} disabled className="bg-muted" />
            </div>
          </div>

          {/* Informations modifiables */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Informations générales</h2>

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

            <div>
              <Label htmlFor="description">Description courte</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio / Présentation détaillée</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={5}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Contact</h2>

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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Zones de pêche */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Zones de pêche</h2>

            <div>
              <Label htmlFor="main_fishing_zone">Zone principale</Label>
              <Input
                id="main_fishing_zone"
                value={formData.main_fishing_zone}
                onChange={(e) => setFormData({ ...formData, main_fishing_zone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="fishing_zones">Zones de pêche (séparées par des virgules)</Label>
              <Input
                id="fishing_zones"
                value={formData.fishing_zones.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fishing_zones: e.target.value.split(',').map((z) => z.trim()).filter(Boolean),
                  })
                }
                placeholder="Méditerranée, Atlantique..."
              />
            </div>

            <div>
              <Label htmlFor="fishing_methods">Méthodes de pêche (séparées par des virgules)</Label>
              <Input
                id="fishing_methods"
                value={formData.fishing_methods.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fishing_methods: e.target.value.split(',').map((m) => m.trim()).filter(Boolean),
                  })
                }
                placeholder="Ligne, Filet, Casier..."
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Photos (URLs)</h2>

            <div>
              <Label htmlFor="photo_url">Photo de profil (URL)</Label>
              <Input
                id="photo_url"
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="photo_boat_1">Photo bateau 1 (URL)</Label>
              <Input
                id="photo_boat_1"
                type="url"
                value={formData.photo_boat_1}
                onChange={(e) => setFormData({ ...formData, photo_boat_1: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="photo_boat_2">Photo bateau 2 (URL)</Label>
              <Input
                id="photo_boat_2"
                type="url"
                value={formData.photo_boat_2}
                onChange={(e) => setFormData({ ...formData, photo_boat_2: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="photo_dock_sale">Photo point de vente (URL)</Label>
              <Input
                id="photo_dock_sale"
                type="url"
                value={formData.photo_dock_sale}
                onChange={(e) => setFormData({ ...formData, photo_dock_sale: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Réseaux sociaux</h2>

            <div>
              <Label htmlFor="instagram_url">Instagram (URL)</Label>
              <Input
                id="instagram_url"
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <Label htmlFor="facebook_url">Facebook (URL)</Label>
              <Input
                id="facebook_url"
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <Label htmlFor="website_url">Site web (URL)</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={status === 'submitting'}
              className="flex-1"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={status === 'submitting'}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecureProfileEdit;
