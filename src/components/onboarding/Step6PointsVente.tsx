import { useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalePoint {
  label: string;
  address: string;
  description: string;
}

interface Step6PointsVenteProps {
  formData: {
    salePoint1Label?: string;
    salePoint1Address?: string;
    salePoint1Description?: string;
    salePoint2Label?: string;
    salePoint2Address?: string;
    salePoint2Description?: string;
  };
  onChange: (field: string, value: any) => void;
}

export const Step6PointsVente = ({ formData, onChange }: Step6PointsVenteProps) => {
  const [showSecondPoint, setShowSecondPoint] = useState(!!formData.salePoint2Label);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mes points de vente</h2>
        <p className="text-muted-foreground">
          Où vends-tu habituellement ton poisson ? (1 à 2 points maximum)
        </p>
      </div>

      {/* Point de vente 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Point de vente 1
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salePoint1Label">Nom du point de vente *</Label>
            <Input
              id="salePoint1Label"
              placeholder="Ex: Marché du port, Quai de la criée..."
              value={formData.salePoint1Label || ''}
              onChange={(e) => onChange('salePoint1Label', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePoint1Address">Adresse ou lieu *</Label>
            <Input
              id="salePoint1Address"
              placeholder="Ex: Quai Cronstadt, Port de Hyères..."
              value={formData.salePoint1Address || ''}
              onChange={(e) => onChange('salePoint1Address', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePoint1Description">Description courte</Label>
            <Textarea
              id="salePoint1Description"
              placeholder="Ex: Sur le quai, à côté de la glacière bleue..."
              value={formData.salePoint1Description || ''}
              onChange={(e) => onChange('salePoint1Description', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Point de vente 2 */}
      {showSecondPoint ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Point de vente 2
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSecondPoint(false);
                  onChange('salePoint2Label', '');
                  onChange('salePoint2Address', '');
                  onChange('salePoint2Description', '');
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salePoint2Label">Nom du point de vente</Label>
              <Input
                id="salePoint2Label"
                placeholder="Ex: Parking du port..."
                value={formData.salePoint2Label || ''}
                onChange={(e) => onChange('salePoint2Label', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePoint2Address">Adresse ou lieu</Label>
              <Input
                id="salePoint2Address"
                placeholder="Ex: Place du Marché..."
                value={formData.salePoint2Address || ''}
                onChange={(e) => onChange('salePoint2Address', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePoint2Description">Description courte</Label>
              <Textarea
                id="salePoint2Description"
                placeholder="Ex: Devant la poissonnerie..."
                value={formData.salePoint2Description || ''}
                onChange={(e) => onChange('salePoint2Description', e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowSecondPoint(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un deuxième point de vente
        </Button>
      )}
    </div>
  );
};
