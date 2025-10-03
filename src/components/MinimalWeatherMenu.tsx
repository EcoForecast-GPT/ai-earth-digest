import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, CloudDrizzle } from 'lucide-react';
import type { WeatherLocation } from '@/pages/Index';

interface MinimalWeatherMenuProps {
  location: WeatherLocation;
  temperature?: number;
  condition: string;
  isLoading: boolean;
  onLocationChange?: (loc: WeatherLocation) => void;
}

const getWeatherIcon = (condition: string) => {
  const iconProps = { className: "w-8 h-8" };
  
  switch (condition.toLowerCase()) {
    case 'very sunny':
    case 'sunny':
      return <Sun {...iconProps} className="w-8 h-8 text-yellow-400" />;
    case 'partly cloudy':
      return <Cloud {...iconProps} className="w-8 h-8 text-gray-400" />;
    case 'cloudy':
    case 'very cloudy':
      return <Cloud {...iconProps} className="w-8 h-8 text-gray-500" />;
    case 'rainy':
      return <CloudDrizzle {...iconProps} className="w-8 h-8 text-blue-400" />;
    case 'stormy':
      return <CloudRain {...iconProps} className="w-8 h-8 text-blue-600" />;
    case 'snowy':
      return <CloudSnow {...iconProps} className="w-8 h-8 text-blue-200" />;
    case 'windy':
      return <Wind {...iconProps} className="w-8 h-8 text-gray-400" />;
    default:
      return <Sun {...iconProps} className="w-8 h-8 text-yellow-400" />;
  }
};

export const MinimalWeatherMenu: React.FC<MinimalWeatherMenuProps> = ({
  location,
  temperature,
  condition,
  isLoading,
  onLocationChange
}) => {
  const [countries, setCountries] = useState<{name: string, code: string}[]>([]);
  const [cities, setCities] = useState<{name: string, country: string, lat: number, lon: number}[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    fetch('/countries.json').then(r => r.json()).then(setCountries);
    fetch('/cities.json').then(r => r.json()).then(setCities);
  }, []);

  useEffect(() => {
    // Set initial country/city from location
    if (location && location.name) {
      const [city, country] = location.name.split(',').map(s => s.trim());
      setSelectedCity(city);
      setSelectedCountry(country);
    }
  }, [location]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
    setSelectedCity("");
  };
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    const cityObj = cities.find(c => c.name === e.target.value && c.country === selectedCountry);
    if (cityObj && onLocationChange) {
      onLocationChange({ lat: cityObj.lat, lon: cityObj.lon, name: `${cityObj.name}, ${cityObj.country}` });
    }
  };

  const filteredCities = cities.filter(c => c.country === selectedCountry);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 flex items-center gap-4"
    >
      <motion.div
        animate={isLoading ? { 
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        } : {
          y: [0, -5, 0],
          rotate: 0
        }}
        transition={{ 
          duration: isLoading ? 2 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {getWeatherIcon(condition)}
      </motion.div>

      <div className="flex-1">
        <motion.div 
          className="text-3xl font-bold text-foreground"
          key={`${temperature ?? 'loading'}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {typeof temperature === 'number' ? `${Math.round(temperature)}°C` : '— °C'}
        </motion.div>
        <motion.div 
          className="text-sm text-muted-foreground capitalize"
          key={condition}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {condition}
        </motion.div>
      </div>

      <div className="text-right min-w-[180px]">
        <div className="text-xs text-muted-foreground">Country</div>
        <select className="w-full mb-1" value={selectedCountry} onChange={handleCountryChange}>
          <option value="">Select country</option>
          {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
        </select>
        <div className="text-xs text-muted-foreground">City</div>
        <select className="w-full" value={selectedCity} onChange={handleCityChange}>
          <option value="">Select city</option>
          {filteredCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>
    </motion.div>
  );
};
