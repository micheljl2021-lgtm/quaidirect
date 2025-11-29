/**
 * Module météo utilisant l'API Open-Meteo (gratuite, sans clé)
 * Documentation: https://open-meteo.com/en/docs/marine-api
 */

export interface PortWeather {
  summary: string;
  temperatureC: number;
  windKts: number;
  swell?: string;
}

/**
 * Récupère la météo maritime pour un port donné
 * 
 * @param lat - Latitude du port
 * @param lng - Longitude du port
 * @returns Les données météo ou null en cas d'erreur
 * 
 * @example
 * ```typescript
 * const weather = await fetchPortWeather(43.1177, 6.1298);
 * if (weather) {
 *   console.log(`Température: ${weather.temperatureC}°C, Vent: ${weather.windKts} nœuds`);
 * }
 * ```
 */
export async function fetchPortWeather(
  lat: number,
  lng: number
): Promise<PortWeather | null> {
  try {
    console.log(`[Weather] Fetching weather for: ${lat}, ${lng}`);

    // API Open-Meteo Marine pour données maritimes
    const url = new URL('https://marine-api.open-meteo.com/v1/marine');
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lng.toString());
    url.searchParams.append('current', 'wave_height,wind_wave_height,wind_speed_10m');
    url.searchParams.append('timezone', 'auto');

    // Également récupérer la température de l'air
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.append('latitude', lat.toString());
    weatherUrl.searchParams.append('longitude', lng.toString());
    weatherUrl.searchParams.append('current', 'temperature_2m');
    weatherUrl.searchParams.append('timezone', 'auto');

    // Requêtes parallèles pour les données marines et météo
    const [marineResponse, weatherResponse] = await Promise.all([
      fetch(url.toString()),
      fetch(weatherUrl.toString()),
    ]);

    if (!marineResponse.ok || !weatherResponse.ok) {
      console.error('[Weather] API error:', {
        marine: marineResponse.status,
        weather: weatherResponse.status,
      });
      return null;
    }

    const marineData = await marineResponse.json();
    const weatherData = await weatherResponse.json();

    // Extraction des données
    const windSpeedMs = marineData.current?.wind_speed_10m ?? 0;
    const windSpeedKts = Math.round(windSpeedMs * 1.94384); // Conversion m/s → nœuds
    const waveHeight = marineData.current?.wave_height ?? 0;
    const temperatureC = Math.round(weatherData.current?.temperature_2m ?? 15);

    // Génération du résumé
    let summary = 'Conditions calmes';
    if (windSpeedKts > 25) {
      summary = 'Vent fort';
    } else if (windSpeedKts > 15) {
      summary = 'Vent modéré';
    } else if (windSpeedKts > 8) {
      summary = 'Petite brise';
    }

    const swell = waveHeight > 0 
      ? `Houle: ${waveHeight.toFixed(1)}m` 
      : undefined;

    const result: PortWeather = {
      summary,
      temperatureC,
      windKts: windSpeedKts,
      swell,
    };

    console.log('[Weather] Success:', result);
    return result;

  } catch (error) {
    console.error('[Weather] Unexpected error:', error);
    return null;
  }
}
