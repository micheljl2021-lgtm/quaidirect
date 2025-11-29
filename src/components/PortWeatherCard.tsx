import { useQuery } from "@tanstack/react-query";
import { fetchPortWeather } from "@/lib/weather";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Wind, Waves, Thermometer, Loader2 } from "lucide-react";

interface PortWeatherCardProps {
  lat: number;
  lng: number;
  portName?: string;
}

/**
 * Composant affichant la météo maritime pour un port
 * 
 * @example
 * ```tsx
 * <PortWeatherCard 
 *   lat={43.1177} 
 *   lng={6.1298} 
 *   portName="Port d'Hyères" 
 * />
 * ```
 */
export function PortWeatherCard({ lat, lng, portName }: PortWeatherCardProps) {
  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['port-weather', lat, lng],
    queryFn: () => fetchPortWeather(lat, lng),
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            {portName ? `Météo ${portName}` : 'Météo au port'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement de la météo...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="w-full border-muted">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            {portName ? `Météo ${portName}` : 'Météo au port'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Météo indisponible pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-sky-200 dark:border-sky-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Cloud className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          {portName ? `Météo ${portName}` : 'Météo au port'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Résumé */}
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-sky-700 dark:text-sky-300">
            {weather.summary}
          </div>
        </div>

        {/* Détails en grille */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Température */}
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Température</span>
              <span className="text-sm font-semibold">{weather.temperatureC}°C</span>
            </div>
          </div>

          {/* Vent */}
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Vent</span>
              <span className="text-sm font-semibold">{weather.windKts} nœuds</span>
            </div>
          </div>

          {/* Houle (si disponible) */}
          {weather.swell && (
            <div className="flex items-center gap-2 col-span-2">
              <Waves className="h-4 w-4 text-cyan-500" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Mer</span>
                <span className="text-sm font-semibold">{weather.swell}</span>
              </div>
            </div>
          )}
        </div>

        {/* Source */}
        <div className="pt-2 border-t border-sky-200 dark:border-sky-800">
          <p className="text-xs text-muted-foreground">
            Source: Open-Meteo Marine API
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
