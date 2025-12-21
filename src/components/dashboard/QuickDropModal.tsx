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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpeciesQuickSelector } from './SpeciesQuickSelector';
import { useQuickDrop } from '@/hooks/useQuickDrop';
import { toast } from 'sonner';
import { Zap, Loader2, MapPin, Clock, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuickDropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  { value: 'matin', label: 'Matin', description: '6h - 9h', icon: '🌅' },
  { value: 'fin_matinee', label: 'Fin matinée', description: '9h - 12h', icon: '☀️' },
  { value: 'midi', label: 'Midi', description: '12h - 14h', icon: '🌞' },
  { value: 'apres_midi', label: 'Après-midi', description: '14h - 18h', icon: '🌤️' },
];

export function QuickDropModal({ open, onOpenChange, onSuccess }: QuickDropModalProps) {
  const navigate = useNavigate();
  const { 
    defaults, 
    salePoints, 
    speciesPresets, 
    isPublishing, 
    publishQuickDrop 
  } = useQuickDrop();

  // Form state
  const [date, setDate] = useState<Date>(new Date());
  const [timeSlot, setTimeSlot] = useState<string>('matin');
  const [salePointId, setSalePointId] = useState<string>('');
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<string[]>([]);

  // Initialize defaults
  useEffect(() => {
    if (open && defaults) {
      setTimeSlot(defaults.default_time_slot || 'matin');
      setSalePointId(defaults.default_sale_point_id || salePoints[0]?.id || '');
    }
    if (open && salePoints.length === 1) {
      setSalePointId(salePoints[0].id);
    }
  }, [open, defaults, salePoints]);

  const handlePublish = async () => {
    if (!salePointId) {
      toast.error('Sélectionnez un point de vente');
      return;
    }
    if (selectedSpeciesIds.length === 0) {
      toast.error('Sélectionnez au moins une espèce');
      return;
    }

    const dropId = await publishQuickDrop({
      date,
      timeSlot,
      salePointId,
      speciesIds: selectedSpeciesIds,
    });

    if (dropId) {
      toast.success('Arrivage publié !', {
        action: {
          label: 'Voir',
          onClick: () => navigate(`/arrivages/${dropId}`),
        },
      });
      // Reset form
      setSelectedSpeciesIds([]);
      onSuccess?.();
    } else {
      toast.error('Erreur lors de la publication');
    }
  };

  const isValid = salePointId && selectedSpeciesIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          {/* Time Slot */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Créneau horaire
            </Label>
            <RadioGroup
              value={timeSlot}
              onValueChange={setTimeSlot}
              className="grid grid-cols-2 gap-2"
            >
              {TIME_SLOTS.map((slot) => (
                <div key={slot.value}>
                  <RadioGroupItem
                    value={slot.value}
                    id={slot.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={slot.value}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-colors min-h-[72px]"
                  >
                    <span className="text-xl mb-1">{slot.icon}</span>
                    <span className="font-medium text-sm">{slot.label}</span>
                    <span className="text-xs text-muted-foreground">{slot.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
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
  );
}
