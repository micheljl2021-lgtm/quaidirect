import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin, Navigation } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNearestPort } from "@/hooks/useNearestPort";

interface Step1Props {
  initialData: {
    portId: string;
    portName: string;
    date: Date;
    timeSlot: string;
  };
  onComplete: (data: { portId: string; portName: string; date: Date; timeSlot: string }) => void;
  onCancel: () => void;
}

interface Port {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

const TIME_SLOTS = [
  { id: "matin", label: "Matin (7h–9h)", value: "matin" },
  { id: "fin_matinee", label: "Fin de matinée (9h–11h)", value: "fin_matinee" },
  { id: "midi", label: "Midi (11h–13h)", value: "midi" },
  { id: "apres_midi", label: "Après-midi (14h–17h)", value: "apres_midi" },
];

export function Step1LieuHoraire({ initialData, onComplete, onCancel }: Step1Props) {
  const { user } = useAuth();
  const [selectedPort, setSelectedPort] = useState(initialData.portId);
  const [selectedPortName, setSelectedPortName] = useState(initialData.portName);
  const [selectedDate, setSelectedDate] = useState<Date>(initialData.date);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(initialData.timeSlot || "matin");
  const [ports, setPorts] = useState<Port[]>([]);
  const [favoritePortId, setFavoritePortId] = useState<string | null>(null);
  
  const { nearestPort, isLoading: geoLoading } = useNearestPort(ports);

  // Load favorite port and sale points
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch fisherman's preferences
      const { data: fishermanData } = await supabase
        .from("fishermen")
        .select("zone_id, default_sale_point_id, default_time_slot")
        .eq("user_id", user.id)
        .single();

      if (fishermanData) {
        // Set favorite port
        if (fishermanData.zone_id) {
          setFavoritePortId(fishermanData.zone_id);
          if (!selectedPort) {
            setSelectedPort(fishermanData.zone_id);
          }
        }

        // Pre-select default time slot
        if (fishermanData.default_time_slot && !initialData.timeSlot) {
          setSelectedTimeSlot(fishermanData.default_time_slot);
        }
      }

      // Fetch all ports with coordinates
      const { data: portsData } = await supabase
        .from("ports")
        .select("id, name, city, latitude, longitude")
        .order("name");

      if (portsData) {
        setPorts(portsData);
        // Pre-select favorite port if not already selected
        if (!selectedPort && fishermanData?.zone_id) {
          const favoritePort = portsData.find(p => p.id === fishermanData.zone_id);
          if (favoritePort) {
            setSelectedPort(favoritePort.id);
            setSelectedPortName(`${favoritePort.name} - ${favoritePort.city}`);
          }
        }
      }
    };

    fetchData();
  }, [user, selectedPort, initialData.timeSlot]);

  // Auto-select nearest port if no selection and geolocation available
  useEffect(() => {
    if (!selectedPort && !favoritePortId && nearestPort && !geoLoading) {
      setSelectedPort(nearestPort.id);
      setSelectedPortName(`${nearestPort.name} - ${nearestPort.city}`);
    }
  }, [nearestPort, geoLoading, selectedPort, favoritePortId]);

  const handlePortSelect = (port: Port) => {
    setSelectedPort(port.id);
    setSelectedPortName(`${port.name} - ${port.city}`);
  };

  const handleContinue = () => {
    if (!selectedPort) return;
    
    onComplete({
      portId: selectedPort,
      portName: selectedPortName,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Où et quand vends-tu ta pêche ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Port Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Port de vente</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ports.slice(0, 6).map((port) => (
                <Button
                  key={port.id}
                  type="button"
                  variant={selectedPort === port.id ? "default" : "outline"}
                  size="lg"
                  className="h-auto py-4 justify-start"
                  onClick={() => handlePortSelect(port)}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{port.name}</div>
                    <div className="text-xs opacity-70">{port.city}</div>
                  </div>
                  {port.id === favoritePortId && (
                    <span className="ml-auto text-xs bg-primary/20 px-2 py-1 rounded">
                      Favori
                    </span>
                  )}
                  {port.id === nearestPort?.id && port.id !== favoritePortId && (
                    <span className="ml-auto text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      Le plus proche
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

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
                  <CalendarIcon className="mr-2 h-5 w-5" />
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
                  className="h-14"
                  onClick={() => setSelectedTimeSlot(slot.value)}
                >
                  {slot.label}
                </Button>
              ))}
            </div>
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
            disabled={!selectedPort}
          >
            Continuer (Étape 2)
          </Button>
        </div>
      </div>
    </div>
  );
}
