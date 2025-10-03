import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, CloudDrizzle } from 'lucide-react';
import { WeatherLocation } from '@/pages/Index';

interface MinimalWeatherMenuProps {
  location: WeatherLocation;
  temperature?: number; // made optional to avoid defaulting to 20
  condition: string;
  isLoading: boolean;
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
  isLoading
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 flex items-center gap-4 w-full max-w-full"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {getWeatherIcon(condition)}
      </div>
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
      
      <div className="text-right">
        <div className="text-xs text-muted-foreground">Location</div>
        <div className="text-sm font-medium text-foreground truncate max-w-[150px]">
          {location.name.split(',')[0]}
        </div>
      </div>
    </motion.div>
  );
};
