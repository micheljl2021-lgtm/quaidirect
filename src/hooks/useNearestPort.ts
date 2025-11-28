import { useState, useEffect } from "react";

interface Port {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useNearestPort(ports: Port[]) {
  const [nearestPort, setNearestPort] = useState<Port | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ports.length === 0) {
      setIsLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("Géolocalisation non disponible");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        let nearest = ports[0];
        let minDistance = calculateDistance(
          latitude,
          longitude,
          nearest.latitude,
          nearest.longitude
        );

        ports.forEach((port) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            port.latitude,
            port.longitude
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearest = port;
          }
        });

        setNearestPort(nearest);
        setIsLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Impossible de récupérer votre position");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, [ports]);

  return { nearestPort, isLoading, error };
}
