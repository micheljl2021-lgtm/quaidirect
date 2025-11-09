import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface Port {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface MapProps {
  ports?: Port[];
  onPortClick?: (portId: string) => void;
  selectedPortId?: string | null;
}

const InteractiveMap = ({ ports = [], onPortClick, selectedPortId }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with OpenStreetMap tiles
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [-1.5, 47.0], // Centre sur la côte atlantique française
      zoom: 6,
    });

    // Add navigation controls
    map.current.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: false,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when ports change
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each port
    ports.forEach(port => {
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';
      
      // Check if this port is selected
      const isSelected = selectedPortId === port.id;
      
      el.innerHTML = `
        <div style="
          width: 100%;
          height: 100%;
          background: ${isSelected ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'};
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        if (!isSelected) {
          el.style.transform = 'scale(1.2)';
        }
      });

      el.addEventListener('mouseleave', () => {
        if (!isSelected) {
          el.style.transform = 'scale(1)';
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([port.longitude, port.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <h3 style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${port.name}</h3>
                <p style="color: #666; font-size: 12px;">${port.city}</p>
              </div>
            `)
        )
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        onPortClick?.(port.id);
      });

      markers.current.push(marker);
    });

    // Fit map to show all ports
    if (ports.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      ports.forEach(port => {
        bounds.extend([port.longitude, port.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [ports, mapReady, selectedPortId, onPortClick]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-border shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapReady && (
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center">
          <p className="text-muted-foreground">Chargement de la carte...</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
