import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Layers, Thermometer, CloudRain, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WeatherMapProps {
  location: { lat: number; lon: number; name: string };
  onLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
}

const NASA_API_KEY = "XjsdXPro2vh4bNJe9sv2PWNGGSBcv72Z74HDnsJG";

// Define NASA Worldview layers
const weatherLayers = [
  { id: 'MODIS_Aqua_Land_Surface_Temp_Day', name: 'Temperature', icon: Thermometer, color: 'text-red-400' },
  { id: 'IMERG_Precipitation_Rate', name: 'Precipitation', icon: CloudRain, color: 'text-blue-400' },
  { id: 'MODIS_Terra_Cloud_Top_Pressure_Day', name: 'Cloud Pressure', icon: Cloud, color: 'text-gray-400' },
];

export const InteractiveWeatherMap = ({ location, onLocationSelect }: WeatherMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const weatherLayerRef = useRef<L.TileLayer | null>(null);
  const [activeLayer, setActiveLayer] = useState(weatherLayers[0].id);

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    // Initialize map
    const map = L.map(mapContainer.current, {
      center: [location.lat, location.lon],
      zoom: 8,
      worldCopyJump: true,
    });
    mapRef.current = map;

    // Add NASA Blue Marble base layer
    L.tileLayer(
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg`,
      {
        // @ts-ignore
        time: getTodayDateString(),
        tileMatrixSet: 'GoogleMapsCompatible_Level9',
        tileSize: 256,
        attribution: '<a href="https://earthdata.nasa.gov/eosdis/science-system-description/services-and-tools/visualization-tools/worldview">NASA Worldview</a>',
        maxNativeZoom: 9,
        maxZoom: 12,
      }
    ).addTo(map);

    // Fix for default icon path issue with webpack/vite
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Add initial marker
    markerRef.current = L.marker([location.lat, location.lon]).addTo(map);

    // Map click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      // Since we cannot do reverse geocoding, we pass a placeholder name
      onLocationSelect({ lat, lon: lng, name: `Selected Location` });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run only once

  // Effect to update weather layer
  useEffect(() => {
    if (!mapRef.current) return;

    if (weatherLayerRef.current) {
      mapRef.current.removeLayer(weatherLayerRef.current);
    }

    const newWeatherLayer = L.tileLayer(
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${activeLayer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.png`,
      {
        // @ts-ignore
        time: getTodayDateString(),
        tileMatrixSet: 'GoogleMapsCompatible_Level9',
        tileSize: 256,
        apiKey: NASA_API_KEY, // Pass API key for GIBS
        maxNativeZoom: 9,
        maxZoom: 12,
        opacity: 0.6,
        transparent: true,
      }
    ).addTo(mapRef.current);

    weatherLayerRef.current = newWeatherLayer;

  }, [activeLayer]);

  // Effect to update map center and marker when location prop changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([location.lat, location.lon], 8);
      if (markerRef.current) {
        markerRef.current.setLatLng([location.lat, location.lon]);
      }
    }
  }, [location.lat, location.lon]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full glass-card rounded-lg p-6 flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4">
          <Map className="w-5 h-5 text-primary" />
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
                onClick={() => setActiveLayer(layer.id)}
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
      </div>

      {/* Location Info */}
      <div className="mt-4 p-3 glass-panel rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">{location.name}</p>
            <p className="text-sm text-muted-foreground">
              Click on the map to select a new location.
            </p>
          </div>
          <Badge variant="outline" className="glass-card">
            <Layers className="w-3 h-3 mr-1" />
            {weatherLayers.find(l => l.id === activeLayer)?.name}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};