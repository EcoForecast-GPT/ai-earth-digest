import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Map, Layers, Thermometer, CloudRain, Eye, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getGibsTileUrl } from '@/services/nasaEarthdataService';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface WeatherMapProps {
  location: { lat: number; lon: number; name: string };
  onLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
}

export const InteractiveWeatherMap = ({ location, onLocationSelect }: WeatherMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState('MODIS_Terra_CorrectedReflectance_TrueColor');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const weatherLayers = [
    { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', name: 'Visible', icon: Eye, color: 'text-blue-400' },
    { id: 'MODIS_Terra_Land_Surface_Temp_Day', name: 'Temperature', icon: Thermometer, color: 'text-red-400' },
    { id: 'AMSRE_Surface_Rain_Rate_Day', name: 'Precipitation', icon: CloudRain, color: 'text-cyan-400' },
  ];

  const switchWeatherLayer = useCallback(async (layerId: string, date: Date) => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const formattedDate = format(date, 'yyyy-MM-dd');
    let tileUrl = getGibsTileUrl(layerId, formattedDate);
    
    // Preflight check
    const sampleTileUrl = tileUrl.replace('{z}/{y}/{x}', '0/0/0');
    let isAvailable = false;
    try {
      const res = await fetch(sampleTileUrl, { method: 'HEAD' });
      if (res.ok) {
        isAvailable = true;
      }
    } catch (e) {
      console.warn(`Network error during GIBS preflight for ${sampleTileUrl}`, e);
    }

    if (!isAvailable) {
      console.warn(`GIBS layer ${layerId} not available for ${formattedDate}. Falling back to TrueColor.`);
      if (layerId !== 'MODIS_Terra_CorrectedReflectance_TrueColor') {
        // Try to load TrueColor for the same date as a fallback
        tileUrl = getGibsTileUrl('MODIS_Terra_CorrectedReflectance_TrueColor', formattedDate);
        setActiveLayer('MODIS_Terra_CorrectedReflectance_TrueColor'); // Visually update the active layer
      } else {
        setMapError(`Base GIBS layer is unavailable for ${formattedDate}.`);
        return; // Can't display anything
      }
    } else {
       setActiveLayer(layerId);
    }

    if (map.current.getLayer('weather-layer')) map.current.removeLayer('weather-layer');
    if (map.current.getSource('weather-overlay')) map.current.removeSource('weather-overlay');

    map.current.addSource('weather-overlay', {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
    });

    map.current.addLayer({
      id: 'weather-layer',
      type: 'raster',
      source: 'weather-overlay',
      paint: { 'raster-opacity': 0.75 },
    });
  }, []);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    let isMounted = true;

    const loadMapLibre = async () => {
      try {
        // Ensure CSS is loaded
        if (!document.querySelector('link[href*="maplibre-gl.css"]')) {
          const link = document.createElement('link');
          link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }

        // Load script
        const maplibregl = await import('maplibre-gl');

        if (!mapContainer.current || !isMounted) return;

        const minimalStyle = {
          version: 8,
          name: 'gibs-base-style',
          sources: {},
          layers: [{
            id: 'background',
            type: 'background',
            paint: { 'background-color': 'hsl(0, 0%, 15%)' }
          }],
        };

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: minimalStyle as any,
          center: [location.lon, location.lat],
          zoom: 4,
          antialias: true,
        });

        map.current.on('error', (e: any) => {
          if (e?.error?.status && e.error.status >= 400) {
            console.warn('Non-fatal map tile error:', e.error.message);
            return;
          }
          setMapError(`Map Error: ${e.error?.message || 'An unknown map error occurred.'}`);
        });

        map.current.on('load', () => {
          if (!isMounted) return;
          setIsMapReady(true);
          
          // Add initial marker
          const el = document.createElement('div');
          el.className = 'location-marker';
          el.style.cssText = `width:20px;height:20px;border-radius:50%;background:#3498db;border:3px solid white;box-shadow:0 0 10px rgba(52,152,219,0.7);`;
          new maplibregl.Marker(el).setLngLat([location.lon, location.lat]).addTo(map.current);
        });

        map.current.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;
          onLocationSelect({ lat, lon: lng, name: `${lat.toFixed(2)}, ${lng.toFixed(2)}` });
        });

      } catch (error) {
        console.error('Failed to load or initialize map:', error);
        setMapError(`Map library failed to load. Details: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    loadMapLibre();

    return () => {
      isMounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Effect to update layer when state changes
  useEffect(() => {
    if (isMapReady) {
      switchWeatherLayer(activeLayer, currentDate);
    }
  }, [isMapReady, activeLayer, currentDate, switchWeatherLayer]);

  // Effect to fly to new location
  useEffect(() => {
    if (isMapReady && map.current) {
      map.current.flyTo({
        center: [location.lon, location.lat],
        zoom: 4,
        essential: true,
      });
    }
  }, [location.lat, location.lon, isMapReady]);

  if (mapError) {
    return (
      <div className="h-full rounded-lg p-4 flex flex-col items-center justify-center text-center bg-destructive/10 border border-destructive/30">
        <Map size={40} className="text-destructive mb-3" />
        <h3 className="font-semibold text-destructive-foreground mb-1">Map Unavailable</h3>
        <p className="text-xs text-muted-foreground font-mono">{mapError}</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full h-96 relative rounded-lg overflow-hidden shadow-lg bg-muted"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div ref={mapContainer} className="w-full h-full" />
      
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading Map...</span>
          </div>
        </div>
      )}
      
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[180px] justify-start text-left font-normal bg-background/80 hover:bg-muted/90 border-border/50',
                !currentDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentDate ? format(currentDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background border-border">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && setCurrentDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full border border-border/50 z-20">
        {weatherLayers.map((layer) => (
          <Button
            key={layer.id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveLayer(layer.id)}
            className={`flex items-center gap-1.5 rounded-full transition-all duration-300 px-3 py-1 h-auto ${
              activeLayer === layer.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <layer.icon className="h-4 w-4" />
            <span className="text-xs font-medium">{layer.name}</span>
          </Button>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-20">
        <Badge variant="secondary" className="bg-background/80 border-border/50">
          {location.name}
        </Badge>
      </div>
    </motion.div>
  );
};