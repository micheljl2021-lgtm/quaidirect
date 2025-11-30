import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SalePointsSectionProps {
  fishermanId: string;
}

export const SalePointsSection = ({ fishermanId }: SalePointsSectionProps) => {
  const navigate = useNavigate();
  const [salePoints, setSalePoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalePoints();
  }, [fishermanId]);

  const fetchSalePoints = async () => {
    try {
      const { data } = await supabase
        .from('fisherman_sale_points')
        .select('*')
        .eq('fisherman_id', fishermanId)
        .order('is_primary', { ascending: false });

      setSalePoints(data || []);
    } catch (error) {
      console.error('Error fetching sale points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Mes points de vente
            </CardTitle>
            <CardDescription>
              Les lieux où tu vends habituellement ta pêche
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pecheur/points-de-vente')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier mon point de vente
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {salePoints.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Aucun point de vente configuré
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/pecheur/points-de-vente')}
            >
              Ajouter un point de vente
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {salePoints.map((point) => (
              <div
                key={point.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    {point.label}
                    {point.is_primary && (
                      <Badge variant="secondary" className="text-xs">
                        Principal
                      </Badge>
                    )}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {point.address}
                </p>
                {point.description && (
                  <p className="text-xs text-muted-foreground italic">
                    {point.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
