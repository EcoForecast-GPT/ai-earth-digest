import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeatherLocation } from "@/pages/Index";
import { MapPin, Calendar, Database, Loader2, Navigation, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLocation } from "@/hooks/useLocation";
import DataExport from "./DataExport";

interface WeatherControlsProps {
  location: WeatherLocation;
  onLocationChange: (location: WeatherLocation) => void;
  date: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
  onFetch: () => void;
  weatherData: any[];
}

const presetLocations: WeatherLocation[] = [
  { lat: 25.276987, lon: 55.296249, name: "Dubai" },
  { lat: 51.5074, lon: -0.1278, name: "London" },
  { lat: 35.6762, lon: 139.6503, name: "Tokyo" },
  { lat: -33.8688, lon: 151.2093, name: "Sydney" },
  { lat: 55.7558, lon: 37.6176, name: "Moscow" }
];

const WeatherControls = ({
  location,
  onLocationChange,
  date,
  onDateChange,
  isLoading,
  onFetch,
  weatherData
}: WeatherControlsProps) => {
  const [customLocation, setCustomLocation] = useState("");
  const [localDate, setLocalDate] = useState(date);
  const { 
    location: detectedLocation, 
    loading: locationLoading, 
    error: locationError, 
    requestLocation 
  } = useLocation();

  useEffect(() => {
    if (detectedLocation) {
      onLocationChange(detectedLocation);
    }
  }, [detectedLocation, onLocationChange]);

  useEffect(() => {
    setLocalDate(date);
  }, [date]);

  const handleCustomLocationSubmit = () => {
    const parts = customLocation.split(',').map(part => part.trim());
    
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        onLocationChange({
          lat,
          lon,
          name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
        });
      } else {
        onLocationChange({
          lat: 25.276987,
          lon: 55.296249,
          name: customLocation
        });
      }
    }
    setCustomLocation("");
  };

  return (
    <motion.div 
      className="p-6 space-y-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div 
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <h2 className="text-xl font-semibold text-foreground">Weather Controls</h2>
      </motion.div>

      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label className="text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Location
        </Label>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={requestLocation}
            disabled={locationLoading}
            variant="outline"
            className="w-full glass-panel hover:glow-primary transition-all duration-300 group"
          >
            {locationLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Detecting Location...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Auto-Detect Location
              </>
            )}
          </Button>
        </motion.div>

        {locationError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg"
          >
            {locationError.message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-2">
          {presetLocations.map((preset, index) => (
            <motion.div
              key={preset.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Button
                variant={location.name === preset.name ? "default" : "outline"}
                className={`w-full justify-start text-left glass-panel transition-all duration-300 ${
                  location.name === preset.name ? "glow-primary" : "hover:glow-accent"
                }`}
                onClick={() => onLocationChange(preset)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {preset.name}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div className="flex space-x-2">
          <Input
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Enter City, State or lat, lon"
            className="glass-panel border-white/10 focus:border-primary/50"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomLocationSubmit()}
          />
          <Button 
            onClick={handleCustomLocationSubmit}
            variant="outline"
            className="glass-panel hover:glow-primary transition-all duration-300"
          >
            <Globe className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>

      <motion.div className="space-y-4">
        <Label className="text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          Date
        </Label>
        <div>
          <Label htmlFor="date" className="text-sm text-muted-foreground">Date</Label>
          <Input
            id="date"
            type="date"
            value={localDate}
            onChange={(e) => {
              setLocalDate(e.target.value);
              onDateChange(e.target.value);
            }}
            className="glass-panel border-white/10 focus:border-accent/50"
          />
        </div>
      </motion.div>

      <motion.div className="glass-panel p-4 rounded-lg">
        <Label className="text-foreground flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-glow-secondary" />
          Auto-Fetched Variables
        </Label>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>• Temperature (°C)</div>
          <div>• Wind Speed (m/s)</div>
          <div>• Precipitation (mm)</div>
          <div>• UV Index</div>
          <div>• Humidity (%)</div>
          <div>• Visibility (km)</div>
        </div>
      </motion.div>

      <Button
        onClick={onFetch}
        disabled={isLoading}
        className="w-full glass-card glow-primary hover:glow-accent transition-all duration-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Fetching NASA Data...
          </>
        ) : (
          <>
            <Database className="w-4 h-4 mr-2" />
            Analyze Weather Data
          </>
        )}
      </Button>

      {weatherData.length > 0 && (
        <DataExport 
          weatherData={weatherData}
          location={location}
          dateRange={{start: date, end: date}}
        />
      )}
    </motion.div>
  );
};

export default WeatherControls;