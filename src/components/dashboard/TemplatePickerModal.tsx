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
import { useQuickDrop } from '@/hooks/useQuickDrop';
import { toast } from 'sonner';
import { FileText, Loader2, MapPin, Clock, CalendarIcon, ArrowLeft, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TemplatePickerModalProps {
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

export function TemplatePickerModal({ open, onOpenChange, onSuccess }: TemplatePickerModalProps) {
  const navigate = useNavigate();
  const { 
    defaults, 
    salePoints, 
    templates, 
    isPublishing, 
    publishFromTemplate 
  } = useQuickDrop();

  // Step management
  const [step, setStep] = useState<'list' | 'confirm'>('list');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Form state for confirmation
  const [date, setDate] = useState<Date>(new Date());
  const [timeSlot, setTimeSlot] = useState<string>('matin');
  const [salePointId, setSalePointId] = useState<string>('');

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('list');
      setSelectedTemplateId(null);
      setDate(new Date());
      setTimeSlot(defaults?.default_time_slot || 'matin');
      setSalePointId(defaults?.default_sale_point_id || salePoints[0]?.id || '');
    }
  }, [open, defaults, salePoints]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('list');
    setSelectedTemplateId(null);
  };

  const handlePublish = async () => {
    if (!selectedTemplateId || !salePointId) {
      toast.error('Données manquantes');
      return;
    }

    const dropId = await publishFromTemplate(selectedTemplateId, {
      date,
      timeSlot,
      salePointId,
    });

    if (dropId) {
      toast.success('Arrivage publié depuis le modèle !', {
        action: {
          label: 'Voir',
          onClick: () => navigate(`/arrivages/${dropId}`),
        },
      });
      onSuccess?.();
    } else {
      toast.error('Erreur lors de la publication');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
            {step === 'list' ? 'Mes modèles' : 'Confirmer la publication'}
          </DialogTitle>
          <DialogDescription>
            {step === 'list' 
              ? 'Sélectionnez un modèle pour créer un arrivage rapidement'
              : 'Vérifiez les informations avant de publier'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'list' ? (
          /* Step 1: Template List */
          <div className="space-y-3 py-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun modèle enregistré</p>
                <p className="text-sm mt-1">
                  Créez des arrivages et sauvegardez-les comme modèles
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start text-left hover:border-primary"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-2xl">{template.icon || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{template.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {template.usage_count || 0} utilisation{(template.usage_count || 0) > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Confirmation */
          <div className="space-y-6 py-4">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux modèles
            </Button>

            {/* Selected template preview */}
            {selectedTemplate && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedTemplate.icon || '📋'}</span>
                  <div>
                    <p className="font-semibold text-lg">{selectedTemplate.name}</p>
                    <p className="text-sm text-muted-foreground">Modèle sélectionné</p>
                  </div>
                </div>
              </div>
            )}

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
                      id={`template-${slot.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`template-${slot.value}`}
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

            {/* Submit */}
            <Button
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 min-h-[52px] text-lg"
              onClick={handlePublish}
              disabled={!salePointId || isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Publication en cours...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" aria-hidden="true" />
                  ✅ Confirmer et publier
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
