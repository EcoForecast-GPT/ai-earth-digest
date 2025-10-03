import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeatherLocation } from "@/pages/Index";
import { MapPin, Calendar, Database, Loader2, Navigation, Globe, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLocation } from "@/hooks/useLocation";
import DataExport from "./DataExport";
import citiesData from "@/data/cities.json";
import countriesData from "@/data/countries.json";

interface WeatherControlsProps {
  location: WeatherLocation;
  onLocationChange: (location: WeatherLocation) => void;
  date: string;
  onDateChange: (date: string) => void;
  isLoading: boolean;
  onFetch: () => void;
  weatherData: any[];
}

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
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>([]);
  const [showResults, setShowResults] = useState(false);
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

  const handleLocationSearch = (searchTerm: string) => {
    setCustomLocation(searchTerm);
    
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const search = searchTerm.toLowerCase();
    
    // Search in cities
    const cityMatches = citiesData
      .filter(city => 
        city.name.toLowerCase().includes(search) || 
        city.country.toLowerCase().includes(search)
      )
      .slice(0, 8)
      .map(city => ({
        lat: city.lat,
        lon: city.lon,
        name: `${city.name}, ${city.country}`
      }));

    // Search in countries
    const countryMatches = countriesData
      .filter(country => 
        country.name.toLowerCase().includes(search) ||
        country.code.toLowerCase() === search
      )
      .slice(0, 4)
      .map(country => ({
        lat: country.lat,
        lon: country.lon,
        name: country.name
      }));

    // Try to parse coordinates
    const parts = searchTerm.split(',').map(p => p.trim());
    let coordResults: WeatherLocation[] = [];
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        coordResults = [{
          lat,
          lon,
          name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
        }];
      }
    }

    const results = [...coordResults, ...cityMatches, ...countryMatches];
    setSearchResults(results);
    setShowResults(results.length > 0);
  };

  const handleSelectLocation = (loc: WeatherLocation) => {
    onLocationChange(loc);
    setCustomLocation("");
    setShowResults(false);
    setSearchResults([]);
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

        <motion.div className="relative">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                value={customLocation}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Search city, country or enter lat, lon"
                className="glass-panel border-white/10 focus:border-primary/50"
                onFocus={() => customLocation.length >= 2 && setShowResults(true)}
              />
              {showResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-50 w-full mt-1 glass-panel border border-border/40 rounded-lg max-h-60 overflow-y-auto"
                >
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.lat}-${result.lon}-${index}`}
                      onClick={() => handleSelectLocation(result)}
                      className="w-full px-4 py-2 text-left hover:bg-primary/10 transition-colors flex items-center gap-2 text-sm"
                    >
                      <MapPin className="w-4 h-4 text-primary" />
                      {result.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            <Button 
              onClick={() => {
                if (searchResults.length > 0) {
                  handleSelectLocation(searchResults[0]);
                }
              }}
              variant="outline"
              className="glass-panel hover:glow-primary transition-all duration-300"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <div className="text-xs text-muted-foreground">
          Global coverage: All countries and major cities supported
        </div>
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