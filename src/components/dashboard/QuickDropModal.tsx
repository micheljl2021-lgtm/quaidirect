import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpeciesQuickSelector } from './SpeciesQuickSelector';
import { SpeciesPhotoPickerModal } from '@/components/SpeciesPhotoPickerModal';
import { useQuickDrop, QuickDropResult } from '@/hooks/useQuickDrop';
import { toast } from 'sonner';
import { Zap, Loader2, MapPin, Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuickDropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}


export function QuickDropModal({ open, onOpenChange, onSuccess }: QuickDropModalProps) {
  const navigate = useNavigate();
  const { 
    defaults, 
    salePoints, 
    speciesPresets, 
    isPublishing, 
    publishQuickDrop,
    getFallbackPhotos,
  } = useQuickDrop();

  // Form state
  const [date, setDate] = useState<Date>(new Date());
  const [customTime, setCustomTime] = useState<string>('07:00');
  const [salePointId, setSalePointId] = useState<string>('');
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<string[]>([]);

  // Photo picker state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [createdDropResult, setCreatedDropResult] = useState<QuickDropResult | null>(null);

  // Initialize defaults
  useEffect(() => {
    if (open && salePoints.length > 0 && !salePointId) {
      setSalePointId(defaults?.default_sale_point_id || salePoints[0]?.id || '');
    }
  }, [open, defaults, salePoints, salePointId]);

  const handlePublish = async () => {
    if (!salePointId) {
      toast.error('Sélectionnez un point de vente');
      return;
    }
    if (selectedSpeciesIds.length === 0) {
      toast.error('Sélectionnez au moins une espèce');
      return;
    }
    if (!customTime) {
      toast.error('Indiquez une heure de vente');
      return;
    }

    const result = await publishQuickDrop({
      date,
      timeSlot: 'custom',
      customTime,
      salePointId,
      speciesIds: selectedSpeciesIds,
    });

    if (result.success && result.dropId) {
      setCreatedDropResult(result);
      // Show photo picker instead of closing
      if (result.speciesName) {
        setShowPhotoPicker(true);
      } else {
        // No species name, complete without photo
        handlePhotoPickerComplete(result.dropId);
      }
    } else {
      toast.error('Erreur lors de la publication');
    }
  };

  const handlePhotoPickerComplete = (dropId?: string) => {
    const finalDropId = dropId || createdDropResult?.dropId;
    
    toast.success('Arrivage publié !', {
      action: {
        label: 'Voir',
        onClick: () => navigate(`/arrivages/${finalDropId}`),
      },
    });
    
    // Reset form
    setSelectedSpeciesIds([]);
    setShowPhotoPicker(false);
    setCreatedDropResult(null);
    onOpenChange(false);
    onSuccess?.();
  };

  const isValid = salePointId && selectedSpeciesIds.length > 0 && customTime;

  // Get fallback photos for the photo picker
  const fallbackPhotos = salePointId ? getFallbackPhotos(salePointId) : undefined;

  return (
    <>
      <Dialog open={open && !showPhotoPicker} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
              Arrivage Express
            </DialogTitle>
            <DialogDescription>
              Publiez un arrivage en quelques secondes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-medium">
                <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                Date de vente
              </Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={fr}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>

            {/* Heure de vente */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Heure de vente
              </Label>
              <div className="flex items-center justify-center">
                <Input 
                  type="time" 
                  value={customTime} 
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-40 h-14 text-xl text-center font-medium"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Indiquez l'heure à laquelle vous serez à quai
              </p>
            </div>

            {/* Sale Point */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-medium">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Point de vente
              </Label>
              {salePoints.length === 1 ? (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{salePoints[0].label}</p>
                  <p className="text-sm text-muted-foreground">{salePoints[0].address}</p>
                </div>
              ) : (
                <Select value={salePointId} onValueChange={setSalePointId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choisir un point de vente" />
                  </SelectTrigger>
                  <SelectContent>
                    {salePoints.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{sp.label}</span>
                          <span className="text-xs text-muted-foreground">{sp.address}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Espèces disponibles</Label>
              <SpeciesQuickSelector
                selectedIds={selectedSpeciesIds}
                onSelectionChange={setSelectedSpeciesIds}
                presets={speciesPresets}
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 min-h-[52px] text-lg"
            onClick={handlePublish}
            disabled={!isValid || isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Publication en cours...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" aria-hidden="true" />
                🚀 Publier maintenant
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Photo Picker Modal */}
      {showPhotoPicker && createdDropResult?.dropId && createdDropResult?.speciesName && (
        <SpeciesPhotoPickerModal
          open={showPhotoPicker}
          onOpenChange={(open) => {
            if (!open) {
              handlePhotoPickerComplete();
            }
          }}
          dropId={createdDropResult.dropId}
          speciesName={createdDropResult.speciesName}
          onComplete={() => handlePhotoPickerComplete()}
          fallbackPhotos={fallbackPhotos}
        />
      )}
    </>
  );
}
