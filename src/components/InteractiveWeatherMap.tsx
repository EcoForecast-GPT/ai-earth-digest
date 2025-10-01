import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Map, Layers, Navigation, Thermometer, Wind, CloudRain, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WeatherMapProps {
  location: { lat: number; lon: number; name: string };
  onLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
}

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const OWM_API_KEY = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;

export const InteractiveWeatherMap = ({ location, onLocationSelect }: WeatherMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('temp_new');

  // Weather layers configuration
  const weatherLayers = [
    { id: 'temp_new', name: 'Temperature', icon: Thermometer, color: 'text-red-400' },
    { id: 'wind_new', name: 'Wind', icon: Wind, color: 'text-cyan-400' },
    { id: 'precipitation_new', name: 'Rain', icon: CloudRain, color: 'text-blue-400' },
    { id: 'clouds_new', name: 'Clouds', icon: Cloud, color: 'text-gray-400' },
  ];

  useEffect(() => {
    const addWeatherLayer = (layerId: string) => {
      if (!map.current || !OWM_API_KEY) return;
      const sourceId = 'weather-source';
      const layerIdOnMap = 'weather-layer';

      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
      if (map.current.getLayer(layerIdOnMap)) map.current.removeLayer(layerIdOnMap);

      map.current.addSource(sourceId, {
        type: 'raster',
        tiles: [`https://tile.openweathermap.org/map/${layerId}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`],
        tileSize: 256,
      });
      map.current.addLayer({
        id: layerIdOnMap,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': 0.6,
        },
      });
    };

    const addLocationMarker = () => {
      // @ts-ignore - MapLibre loaded dynamically
      const maplibregl = window.maplibregl;
      if (!maplibregl) return;

      if (marker.current) {
        marker.current.setLngLat([location.lon, location.lat]);
      } else {
        marker.current = new maplibregl.Marker({ color: "hsl(180 100% 50%)", scale: 1.2 })
          .setLngLat([location.lon, location.lat])
          .addTo(map.current);
      }
    };

    const initializeMapInternal = () => {
      if (!mapContainer.current || map.current) {
        return;
      }

      try {
        // @ts-ignore - MapLibre loaded dynamically
        const maplibregl = window.maplibregl;
        
        if (!maplibregl) {
          setIsLoaded(true);
          return;
        }

        map.current = new maplibregl.Map({
          container: mapContainer.current!,
          style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_API_KEY}`,
          center: [location.lon, location.lat],
          zoom: 8,
          antialias: true,
        });

        map.current.on('load', () => {
          setIsLoaded(true);
          addWeatherLayer(activeLayer);
          addLocationMarker();
        });

        map.current.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;
          fetchLocationName(lat, lng);
        });

      } catch (error) {
        console.error('Map initialization failed:', error);
        setIsLoaded(true);
      }
    };

    const loadMapLibre = () => {
      if (window.maplibregl) {
        initializeMapInternal();
        return;
      }

      try {
        // Add CSS
        const link = document.createElement('link');
        link.href = 'https://unpkg.com/maplibre-gl@4.1.3/dist/maplibre-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Add JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/maplibre-gl@4.1.3/dist/maplibre-gl.js';
        script.onload = initializeMapInternal;
        document.head.appendChild(script);

      } catch (error) {
        console.error('Failed to load MapLibre:', error);
        setIsLoaded(true); // Show fallback
      }
    };

    loadMapLibre();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // It's good practice to clean up dynamically added scripts and styles
      const scriptElement = document.querySelector('script[src="https://unpkg.com/maplibre-gl@4.1.3/dist/maplibre-gl.js"]');
      if (scriptElement) {
        scriptElement.remove();
      }
      const styleElement = document.querySelector('link[href="https://unpkg.com/maplibre-gl@4.1.3/dist/maplibre-gl.css"]');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []); // Run this effect only once on mount

  // Effect to update map center and marker when location prop changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      map.current.flyTo({
        center: [location.lon, location.lat],
        zoom: 8,
        speed: 1.2,
      });

      // @ts-ignore
      if (marker.current) {
        marker.current.setLngLat([location.lon, location.lat]);
      }
    }
  }, [location.lat, location.lon]);

  const fetchLocationName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      const data = await response.json();
      const name = data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      onLocationSelect({
        lat: lat,
        lon: lon,
        name: name
      });
    } catch (error) {
      console.error('Geocoding failed:', error);
      onLocationSelect({
        lat: lat,
        lon: lon,
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      });
    }
  };

  const switchWeatherLayer = useCallback((layerId: string) => {
    setActiveLayer(layerId);
    if (map.current && map.current.isStyleLoaded() && OWM_API_KEY) {
      const source = map.current.getSource('weather-source');
      if (source) {
        source.tiles = [`https://tile.openweathermap.org/map/${layerId}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`];
        map.current.getSourceCache(source.id).clearTiles();
        map.current.getSourceCache(source.id).update(map.current.transform);
        map.current.triggerRepaint();
      }
    }
  }, []);

  // Fallback UI if map fails to load
  if (true) { // Always render the container, map will attach to it.
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
                  onClick={() => switchWeatherLayer(layer.id)}
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
                <Navigation className="w-8 h-8" />
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
};