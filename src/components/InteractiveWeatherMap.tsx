import React, { useEffect, useRef, useState } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState('MODIS_Terra_CorrectedReflectance_TrueColor');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // No MapTiler API key required — we'll use NASA GIBS tiles as the base layer.

  // Weather layers configuration
  const weatherLayers = [
    { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', name: 'Visible Imagery', icon: Eye, color: 'text-blue-400' },
    { id: 'MODIS_Terra_Land_Surface_Temp_Day', name: 'Temperature', icon: Thermometer, color: 'text-red-400' },
    { id: 'AMSRE_Surface_Rain_Rate_Day', name: 'Precipitation', icon: CloudRain, color: 'text-cyan-400' },
  ];

  // No client-side API key required for NASA GIBS tiles.

  // Initialize MapLibre with MapTiler
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Dynamically load MapLibre GL JS
    const loadMapLibre = async () => {
      try {

        // Add CSS
        const link = document.createElement('link');
        link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Add JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
        script.onload = initializeMap;
        script.onerror = () => {
            setMapError("Failed to load the map library. Please check your network connection or ad blocker settings.");
            setIsLoaded(true);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load MapLibre:', error);
        setMapError(`An unexpected error occurred while loading the map. Details: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoaded(true); // Show fallback
      }
    };

    const initializeMap = () => {
      try {
        // @ts-ignore - MapLibre loaded dynamically
        const maplibregl = window.maplibregl;
        
        if (!maplibregl) {
          setMapError("Map library did not initialize correctly.");
          setIsLoaded(true);
          return;
        }

        // Initialize with a minimal inlined style and no external basemap provider.
        // We'll add NASA GIBS raster tiles as the primary base layer.
        const minimalStyle = {
          version: 8,
          name: 'gibs-base-style',
          sources: {},
          layers: [],
        };

        map.current = new maplibregl.Map({
          container: mapContainer.current!,
          style: minimalStyle as any,
          center: [location.lon, location.lat],
          zoom: 4,
          antialias: true,
        });

        map.current.on('error', (e: any) => {
            setMapError(`Map Error: ${e.error?.message || 'An unknown map error occurred.'}`);
        });

        map.current.on('load', () => {
          setIsLoaded(true);
          // Add the GIBS layer immediately as the base layer
          addWeatherLayer();
          addLocationMarker();
        });

        map.current.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;
          fetchLocationName(lat, lng);
        });

      } catch (error) {
        console.error('Map initialization failed:', error);
        setMapError(`Map initialization failed. Details: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoaded(true);
      }
    };

    const addWeatherLayer = () => {
      if (!map.current) return;
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      const tileUrl = getGibsTileUrl(activeLayer, formattedDate);

      if (map.current.getLayer('weather-layer')) {
        map.current.removeLayer('weather-layer');
      }
      if (map.current.getSource('weather-overlay')) {
        map.current.removeSource('weather-overlay');
      }

      map.current.addSource('weather-overlay', {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
      });

      map.current.addLayer({
        id: 'weather-layer',
        type: 'raster',
        source: 'weather-overlay',
        paint: {
          'raster-opacity': 0.7,
        },
      });
    };

    const addLocationMarker = () => {
      // @ts-ignore
      const maplibregl = window.maplibregl;
      if (!maplibregl) return;

      const el = document.createElement('div');
      el.className = 'location-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #3498db;
        border: 3px solid white;
        box-shadow: 0 0 15px rgba(52, 152, 219, 0.7);
        cursor: pointer;
      `;

      new maplibregl.Marker(el)
        .setLngLat([location.lon, location.lat])
        .addTo(map.current);
    };

    loadMapLibre();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isLoaded && map.current) {
      switchWeatherLayer(activeLayer, currentDate);
    }
  }, [activeLayer, currentDate, isLoaded]);

    const fetchLocationName = async (lat: number, lon: number) => {
      // No external geocoding service configured — fallback to coordinates.
      onLocationSelect({ lat, lon, name: `${lat.toFixed(2)}, ${lon.toFixed(2)}` });
    };

  const switchWeatherLayer = (layerId: string, date: Date) => {
    setActiveLayer(layerId);
    if (map.current && map.current.isStyleLoaded()) {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const tileUrl = getGibsTileUrl(layerId, formattedDate);

        const source = map.current.getSource('weather-overlay');
        if (source) {
            // @ts-ignore
            source.setTiles([tileUrl]);
            // Force a refresh of the tile cache
            map.current.style.sourceCaches['weather-overlay'].clearTiles();
            map.current.style.sourceCaches['weather-overlay'].update(map.current.transform);
            map.current.triggerRepaint();
        }
    }
  };

  // Fallback UI if map fails to load
  if (mapError) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full glass-card rounded-lg p-6 flex flex-col items-center justify-center text-center"
        >
            <div className="text-red-400 mb-4">
                <Map size={48} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Map Unavailable</h3>
            <p className="text-gray-400 text-sm mb-4">The interactive map could not be loaded.</p>
            <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3 text-left text-xs text-red-300">
                <p className="font-mono">{mapError}</p>
            </div>
        </motion.div>
    );
  }

  if (!isLoaded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full glass-card rounded-lg p-6 flex flex-col"
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="p-2 rounded-lg bg-primary/20 border border-primary/30"
          >
            <Map className="w-5 h-5 text-primary" />
          </motion.div>
          <h3 className="text-lg font-semibold text-foreground">Interactive Weather Map</h3>
        </div>

        {/* Weather Layer Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          {weatherLayers.map((layer) => {
            const IconComponent = layer.icon;
            return (
              <motion.div
                key={layer.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={activeLayer === layer.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchWeatherLayer(layer.id, currentDate)}
                  className="glass-card border-border/50"
                >
                  <IconComponent className={`w-4 h-4 mr-2 ${layer.color}`} />
                  {layer.name}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden rounded-lg border border-border/50">
          <div 
            ref={mapContainer} 
            className="w-full h-full bg-gradient-to-br from-secondary/30 to-accent/20"
            style={{ minHeight: '400px' }}
          />
          
          {/* Loading overlay */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-primary"
              >
                <Loader className="w-8 h-8" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Location Info */}
        <div className="mt-4 p-3 glass-panel rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{location.name}</p>
              <p className="text-sm text-muted-foreground">
                {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
              </p>
            </div>
            <Badge variant="outline" className="glass-card">
              <Layers className="w-3 h-3 mr-1" />
              {weatherLayers.find(l => l.id === activeLayer)?.name}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Click on the map to select a new location • Global weather coverage
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="w-full h-96 relative rounded-2xl overflow-hidden shadow-2xl bg-slate-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div ref={mapContainer} className="w-full h-full" />
      
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[200px] justify-start text-left font-normal bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 text-white',
                !currentDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentDate ? format(currentDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && setCurrentDate(date)}
              initialFocus
              className="text-white"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm p-2 rounded-full border border-slate-700">
        {weatherLayers.map((layer) => (
          <Button
            key={layer.id}
            variant="ghost"
            size="sm"
            onClick={() => switchWeatherLayer(layer.id, currentDate)}
            className={`flex items-center gap-2 rounded-full transition-all duration-300 ${
              activeLayer === layer.id
                ? 'bg-blue-500 text-white'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <layer.icon className={`h-5 w-5 ${activeLayer === layer.id ? '' : layer.color}`} />
            <span className="hidden sm:inline">{layer.name}</span>
          </Button>
        ))}
      </div>

      <div className="absolute top-3 right-3">
        <Badge variant="secondary" className="bg-slate-800/80 text-slate-300 border-slate-700">
          {location.name}
        </Badge>
      </div>
    </motion.div>
  );
};