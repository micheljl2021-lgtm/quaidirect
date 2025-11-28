import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrivageData } from "@/pages/CreateArrivageWizard";
import { DropPhotosUpload } from "@/components/DropPhotosUpload";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Calendar, Clock, Edit, CheckCircle2, Loader2, Camera } from "lucide-react";

interface Step3Props {
  arrivageData: ArrivageData;
  onPublish: () => void;
  onEditLieu: () => void;
  onEditSpecies: () => void;
  isPublishing: boolean;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  matin: "Matin (7h–9h)",
  fin_matinee: "Fin de matinée (9h–11h)",
  midi: "Midi (11h–13h)",
  apres_midi: "Après-midi (14h–17h)",
};

export function Step3Recapitulatif({
  arrivageData,
  onPublish,
  onEditLieu,
  onEditSpecies,
  isPublishing,
  photos,
  onPhotosChange,
}: Step3Props) {
  const [showPhotos, setShowPhotos] = useState(false);

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Vérifie ton arrivage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Box */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Tu pourras encore modifier cet arrivage après publication.</p>
                <p className="text-muted-foreground">
                  Après publication, tes clients verront l'arrivage sur la carte et les abonnés Premium recevront une notification.
                </p>
              </div>
            </div>
          </div>

          {/* Lieu & Horaires */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Lieu & Horaires</h3>
              <Button variant="ghost" size="sm" onClick={onEditLieu}>
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">{arrivageData.portName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{format(arrivageData.date, "EEEE d MMMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>{TIME_SLOT_LABELS[arrivageData.timeSlot]}</span>
              </div>
            </div>
          </div>

          {/* Espèces */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Espèces ({arrivageData.species.length})</h3>
              <Button variant="ghost" size="sm" onClick={onEditSpecies}>
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </div>
            <div className="space-y-2">
              {arrivageData.species.map((species) => (
                <div
                  key={species.id}
                  className="bg-muted/50 rounded-lg p-4 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{species.speciesName}</span>
                    <span className="font-semibold text-primary">
                      {species.price}€/{species.unit}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Quantité : {species.quantity} {species.unit}
                  </div>
                  {species.remark && (
                    <div className="text-sm text-muted-foreground italic">
                      {species.remark}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photos ({photos.length}/5)
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPhotos(!showPhotos)}
              >
                {showPhotos ? "Masquer" : "Ajouter des photos"}
              </Button>
            </div>
            {showPhotos && (
              <DropPhotosUpload
                maxPhotos={5}
                onPhotosChange={onPhotosChange}
                initialPhotos={photos}
              />
            )}
            {photos.length > 0 && !showPhotos && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs text-green-800 dark:text-green-200">
                  ✅ {photos.length} photo(s) ajoutée(s) • Des photos augmentent vos ventes de 40%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
        <div className="container max-w-4xl mx-auto">
          <Button
            type="button"
            size="lg"
            className="w-full h-16 text-lg font-semibold"
            onClick={onPublish}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Publication en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Publier l'arrivage
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
