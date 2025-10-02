import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Layers, Navigation, Thermometer, Wind, CloudRain, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WeatherMapProps {
  location: { lat: number; lon: number; name: string };
  onLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
}

const MAPTILER_API_KEY = 'GlbLuLlMNruYspOH4MNV';

export const InteractiveWeatherMap = ({ location, onLocationSelect }: WeatherMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('temperature');
  const [weatherData, setWeatherData] = useState<any>(null);

  // Weather layers configuration
  const weatherLayers = [
    { id: 'temperature', name: 'Temperature', icon: Thermometer, color: 'text-red-400' },
    { id: 'wind', name: 'Wind', icon: Wind, color: 'text-cyan-400' },
    { id: 'precipitation', name: 'Rain', icon: CloudRain, color: 'text-blue-400' },
    { id: 'visibility', name: 'Visibility', icon: Eye, color: 'text-purple-400' },
  ];

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
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load MapLibre:', error);
        setIsLoaded(true); // Show fallback
      }
    };

    const initializeMap = () => {
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
          addWeatherLayers();
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

    const addWeatherLayers = () => {
      // Add OpenWeatherMap weather layers
      const weatherSources = {
        temperature: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY`,
        wind: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY`,
        precipitation: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY`,
        visibility: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY`,
      };

      // Note: In production, you'd need a valid OpenWeatherMap API key
      // For demo, we'll create mock weather overlay
      map.current.addSource('weather-overlay', {
        type: 'raster',
        tiles: [weatherSources[activeLayer as keyof typeof weatherSources]],
        tileSize: 256,
      });

      map.current.addLayer({
        id: 'weather-layer',
        type: 'raster',
        source: 'weather-overlay',
        paint: {
          'raster-opacity': 0.6,
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
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(180 100% 50%), hsl(150 100% 45%));
        border: 3px solid white;
        box-shadow: 0 0 20px hsl(180 100% 50% / 0.6);
        cursor: pointer;
        animation: pulse 2s infinite;
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

  const fetchLocationName = async (lat: number, lon: number) => {
    try {
      // Mock reverse geocoding - in production use a real service
      const cityNames = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
      const randomCity = cityNames[Math.floor(Math.random() * cityNames.length)];
      
      onLocationSelect({
        lat: lat,
        lon: lon,
        name: `${randomCity}, USA`
      });
    } catch (error) {
      console.error('Geocoding failed:', error);
      onLocationSelect({
        lat: lat,
        lon: lon,
        name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`
      });
    }
  };

  const switchWeatherLayer = (layerId: string) => {
    setActiveLayer(layerId);
    if (map.current && map.current.getLayer('weather-layer')) {
      // Update the weather layer source
      map.current.removeLayer('weather-layer');
      map.current.removeSource('weather-overlay');
      
      // Add new layer (simplified for demo)
      setTimeout(() => {
        if (map.current) {
          map.current.addSource('weather-overlay', {
            type: 'raster',
            tiles: [`https://tile.openweathermap.org/map/${layerId}_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY`],
            tileSize: 256,
          });

          map.current.addLayer({
            id: 'weather-layer',
            type: 'raster',
            source: 'weather-overlay',
            paint: {
              'raster-opacity': 0.6,
            },
          });
        }
      }, 100);
    }
  };

  // Fallback UI if map fails to load
  if (!isLoaded && map.current === null) {
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

  return null; // Map will render in the container
};