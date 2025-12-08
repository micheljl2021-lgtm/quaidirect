import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CalendarIcon, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Step1Data {
  salePointId: string;
  salePointLabel: string;
  date: Date;
  timeSlot: string;
}

interface Step1Props {
  initialData: Partial<Step1Data>;
  onComplete: (data: Step1Data) => void;
  onCancel: () => void;
}

const TIME_SLOTS = [
  { id: "matin", label: "Matin (7h–9h)", value: "matin" },
  { id: "fin_matinee", label: "Fin de matinée (9h–11h)", value: "fin_matinee" },
  { id: "midi", label: "Midi (11h–13h)", value: "midi" },
  { id: "apres_midi", label: "Après-midi (14h–17h)", value: "apres_midi" },
  { id: "custom", label: "Personnalisé", value: "custom" },
];

export function Step1LieuHoraire({ initialData, onComplete, onCancel }: Step1Props) {
  const { user } = useAuth();
  const [salePoints, setSalePoints] = useState<any[]>([]);
  const [selectedSalePoint, setSelectedSalePoint] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(initialData.date || new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(initialData.timeSlot || 'matin');
  const [customTime, setCustomTime] = useState<string>("08:00");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: fishermenData } = await supabase
          .from('fishermen')
          .select('id, default_time_slot')
          .eq('user_id', user.id)
          .single();

        if (!fishermenData) return;

        // Pre-fill default time slot
        if (fishermenData.default_time_slot && !initialData.timeSlot) {
          setSelectedTimeSlot(fishermenData.default_time_slot);
        }

        // Fetch fisherman's sale points (max 2)
        const { data: salePointsData } = await supabase
          .from('fisherman_sale_points')
          .select('*')
          .eq('fisherman_id', fishermenData.id)
          .order('is_primary', { ascending: false });

        if (salePointsData && salePointsData.length > 0) {
          setSalePoints(salePointsData);
          
          // Pre-select primary or from initial data
          if (initialData.salePointId) {
            const initialSalePoint = salePointsData.find(sp => sp.id === initialData.salePointId);
            if (initialSalePoint) {
              setSelectedSalePoint(initialSalePoint);
            }
          } else {
            const primaryPoint = salePointsData.find(sp => sp.is_primary);
            if (primaryPoint) {
              setSelectedSalePoint(primaryPoint);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [initialData.salePointId, initialData.timeSlot]);

  const handleSalePointSelect = (salePoint: any) => {
    setSelectedSalePoint(salePoint);
  };

  const handleContinue = () => {
    if (!selectedSalePoint) {
      toast.error('Veuillez configurer au moins un point de vente');
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      toast.error('Veuillez sélectionner une date et un créneau horaire');
      return;
    }

    onComplete({
      salePointId: selectedSalePoint.id,
      salePointLabel: selectedSalePoint.label,
      date: selectedDate,
      timeSlot: selectedTimeSlot === 'custom' ? `custom_${customTime}` : selectedTimeSlot,
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Où et quand vends-tu ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sale Point Selection */}
          {salePoints.length > 0 ? (
            <div>
              <label className="block text-sm font-medium mb-3">Point de vente</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {salePoints.map((salePoint) => {
                  const isSelected = selectedSalePoint?.id === salePoint.id;

                  return (
                    <Button
                      key={salePoint.id}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      className={`h-auto py-4 px-4 justify-start text-left ${
                        salePoint.is_primary ? 'border-primary border-2' : ''
                      }`}
                      onClick={() => handleSalePointSelect(salePoint)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <MapPin className="h-5 w-5 mt-1 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold flex items-center gap-2 flex-wrap">
                            {salePoint.label}
                            {salePoint.is_primary && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                Principal
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{salePoint.address}</div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-muted p-6 rounded-lg text-center">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
              <p className="font-semibold mb-2">Aucun point de vente configuré</p>
              <p className="text-sm text-muted-foreground mb-4">
                Configure tes points de vente pour créer des arrivages
              </p>
              <Button onClick={() => window.location.href = '/pecheur/points-de-vente'}>
                Configurer mes points de vente
              </Button>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Date de vente</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start text-left font-normal h-14"
                >
                  <CalendarIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  {selectedDate ? (
                    format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Créneau horaire</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <Button
                  key={slot.id}
                  type="button"
                  variant={selectedTimeSlot === slot.value ? "default" : "outline"}
                  size="lg"
                  className={`h-14 ${slot.id === 'custom' ? 'col-span-1 sm:col-span-2' : ''}`}
                  onClick={() => setSelectedTimeSlot(slot.value)}
                >
                  {slot.id === 'custom' && <Clock className="h-5 w-5 mr-2" aria-hidden="true" />}
                  {slot.label}
                </Button>
              ))}
            </div>
            
            {/* Custom time input */}
            {selectedTimeSlot === 'custom' && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <label className="block text-sm font-medium mb-2">Heure personnalisée</label>
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="h-14 text-lg max-w-xs"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  L'heure saisie sera utilisée comme heure de début de vente
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
        <div className="container max-w-4xl mx-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 h-14"
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1 h-14 text-lg"
            onClick={handleContinue}
            disabled={!selectedSalePoint}
          >
            Continuer (Étape 2)
          </Button>
        </div>
      </div>
    </div>
  );
}