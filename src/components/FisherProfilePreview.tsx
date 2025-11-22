import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Facebook, Instagram, Globe } from 'lucide-react';

interface FisherProfilePreviewProps {
  boatName: string;
  companyName: string;
  mainFishingZone: string;
  generatedDescription: string;
  selectedSpecies: string[];
  speciesNames: Record<string, string>;
  fishingMethods: string[];
  fishingZones: string[];
  phone: string;
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  photoBoat1: string | null;
}

export const FisherProfilePreview = ({
  boatName,
  companyName,
  mainFishingZone,
  generatedDescription,
  selectedSpecies,
  speciesNames,
  fishingMethods,
  fishingZones,
  phone,
  email,
  facebookUrl,
  instagramUrl,
  websiteUrl,
  photoBoat1,
}: FisherProfilePreviewProps) => {
  return (
    <Card className="sticky top-4 h-fit">
      <CardHeader className="bg-primary/5 border-b">
        <Badge variant="outline" className="w-fit">
          Aperçu en temps réel
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {/* Hero avec photo bateau */}
        {photoBoat1 && (
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={photoBoat1}
              alt="Bateau"
              className="w-full h-32 object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80">
              <h3 className="text-lg font-bold text-white">
                {boatName || 'Nom du bateau'}
              </h3>
            </div>
          </div>
        )}

        {/* Nom et société */}
        {!photoBoat1 && (
          <div>
            <h3 className="text-xl font-bold">{boatName || 'Nom du bateau'}</h3>
            {companyName && (
              <p className="text-muted-foreground">{companyName}</p>
            )}
          </div>
        )}

        {/* Zone */}
        {mainFishingZone && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{mainFishingZone}</span>
          </div>
        )}

        {/* CTA */}
        <Button className="w-full" size="sm">
          Voir les arrivages
        </Button>

        {/* Description */}
        {generatedDescription && (
          <div className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4 border-t pt-4">
            {generatedDescription}
          </div>
        )}

        {/* Espèces */}
        {selectedSpecies.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Espèces pêchées</h4>
            <div className="flex flex-wrap gap-1">
              {selectedSpecies.slice(0, 6).map((id) => (
                <Badge key={id} variant="secondary" className="text-xs">
                  {speciesNames[id] || 'Espèce'}
                </Badge>
              ))}
              {selectedSpecies.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedSpecies.length - 6}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Méthodes de pêche */}
        {fishingMethods.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Méthodes de pêche</h4>
            <div className="flex flex-wrap gap-1">
              {fishingMethods.slice(0, 4).map((method) => (
                <Badge key={method} variant="outline" className="text-xs">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Contact</h4>
          {phone && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3 w-3 text-primary" />
              <span>{phone}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3 w-3 text-primary" />
              <span className="truncate">{email}</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {facebookUrl && (
              <div className="p-1.5 rounded-full bg-primary/10">
                <Facebook className="h-3 w-3 text-primary" />
              </div>
            )}
            {instagramUrl && (
              <div className="p-1.5 rounded-full bg-primary/10">
                <Instagram className="h-3 w-3 text-primary" />
              </div>
            )}
            {websiteUrl && (
              <div className="p-1.5 rounded-full bg-primary/10">
                <Globe className="h-3 w-3 text-primary" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
