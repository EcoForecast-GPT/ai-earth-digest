import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { WeatherData, WeatherLocation } from '@/pages/Index';
import { Thermometer, Wind, CloudRain, Droplets, AlertTriangle } from 'lucide-react';

interface WeatherLikelihoodProps {
  location: WeatherLocation;
  weatherData: WeatherData[];
  isLoading: boolean;
}

interface LikelihoodCondition {
  label: string;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  icon: React.ElementType;
  description: string;
}

const WeatherLikelihood: React.FC<WeatherLikelihoodProps> = ({ 
  location, 
  weatherData, 
  isLoading 
}) => {
  const calculateLikelihood = (): LikelihoodCondition[] => {
    if (!weatherData.length) return [];

    const avgTemp = weatherData.reduce((sum, d) => sum + d.temperature, 0) / weatherData.length;
    const avgPrecip = weatherData.reduce((sum, d) => sum + d.precipitation, 0) / weatherData.length;
    const avgWind = weatherData.reduce((sum, d) => sum + d.windSpeed, 0) / weatherData.length;
    const avgHumidity = weatherData.reduce((sum, d) => sum + d.humidity, 0) / weatherData.length;

    const tempVariance = weatherData.reduce((sum, d) => sum + Math.pow(d.temperature - avgTemp, 2), 0) / weatherData.length;
    const windVariance = weatherData.reduce((sum, d) => sum + Math.pow(d.windSpeed - avgWind, 2), 0) / weatherData.length;

    const conditions: LikelihoodCondition[] = [];

    // Very Hot (wider range)
    const hotProbability = Math.min(100, Math.max(0, (avgTemp - 20) * 5 + Math.sqrt(tempVariance) * 2));
    conditions.push({
      label: 'Very Hot',
      probability: Math.round(hotProbability),
      severity: hotProbability > 70 ? 'extreme' : hotProbability > 50 ? 'high' : hotProbability > 25 ? 'medium' : 'low',
      icon: Thermometer,
      description: `High temperatures expected (>${Math.round(avgTemp + 7)}°C)`
    });

    // Very Cold (wider range)
    const coldProbability = Math.min(100, Math.max(0, (15 - avgTemp) * 5 + Math.sqrt(tempVariance) * 2));
    conditions.push({
      label: 'Very Cold',
      probability: Math.round(coldProbability),
      severity: coldProbability > 70 ? 'extreme' : coldProbability > 50 ? 'high' : coldProbability > 25 ? 'medium' : 'low',
      icon: Thermometer,
      description: `Freezing temperatures possible (<${Math.round(avgTemp - 7)}°C)`
    });

    // Very Windy (wider range)
    const windyProbability = Math.min(100, Math.max(0, (avgWind - 5) * 8 + Math.sqrt(windVariance) * 3));
    conditions.push({
      label: 'Very Windy',
      probability: Math.round(windyProbability),
      severity: windyProbability > 70 ? 'extreme' : windyProbability > 50 ? 'high' : windyProbability > 25 ? 'medium' : 'low',
      icon: Wind,
      description: `Strong winds expected (>${Math.round(avgWind + 8)} m/s)`
    });

    // Very Wet (wider range)
    const wetProbability = Math.min(100, Math.max(0, avgPrecip * 2.5 + avgHumidity * 0.7 - 15));
    conditions.push({
      label: 'Very Wet',
      probability: Math.round(wetProbability),
      severity: wetProbability > 70 ? 'extreme' : wetProbability > 50 ? 'high' : wetProbability > 25 ? 'medium' : 'low',
      icon: CloudRain,
      description: `Heavy precipitation likely (>${Math.round(avgPrecip + 15)}mm)`
    });

    // Very Uncomfortable (heat index, wider range)
    const discomfortIndex = (avgTemp - 18) * 2.5 + (avgHumidity - 55) * 0.7 + avgWind * 0.4;
    const uncomfortableProbability = Math.min(100, Math.max(0, discomfortIndex * 2.2));
    conditions.push({
      label: 'Very Uncomfortable',
      probability: Math.round(uncomfortableProbability),
      severity: uncomfortableProbability > 70 ? 'extreme' : uncomfortableProbability > 50 ? 'high' : uncomfortableProbability > 25 ? 'medium' : 'low',
      icon: AlertTriangle,
      description: 'Poor conditions for outdoor activities'
    });

    return conditions.sort((a, b) => b.probability - a.probability);
  };

  const conditions = calculateLikelihood();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'text-red-400 border-red-400/30 bg-red-500/10';
      case 'high': return 'text-orange-400 border-orange-400/30 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      default: return 'text-green-400 border-green-400/30 bg-green-500/10';
    }
  };

  const getSeverityGlow = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'shadow-red-500/20';
      case 'high': return 'shadow-orange-500/20';
      case 'medium': return 'shadow-yellow-500/20';
      default: return 'shadow-green-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-3 h-3 bg-aurora rounded-full"
        />
        <h3 className="text-lg font-semibold text-aurora">
          Weather Likelihood Analysis
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-foreground/20 rounded" />
                  <div className="w-24 h-4 bg-foreground/20 rounded" />
                </div>
                <div className="w-12 h-4 bg-foreground/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => {
            const Icon = condition.icon;
            return (
              <motion.div
                key={condition.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Card className={`
                  glass-card p-4 border transition-all duration-300 hover:scale-[1.02]
                  ${getSeverityColor(condition.severity)}
                  ${getSeverityGlow(condition.severity)}
                  shadow-lg
                `}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ 
                          scale: condition.severity === 'extreme' ? [1, 1.2, 1] : 1,
                          rotate: condition.severity === 'extreme' ? [0, 5, -5, 0] : 0 
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: condition.severity === 'extreme' ? Infinity : 0 
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      <div>
                        <p className="font-medium">{condition.label}</p>
                        <p className="text-xs opacity-75">{condition.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <motion.p 
                        className="text-lg font-bold"
                        animate={{ 
                          scale: condition.probability > 70 ? [1, 1.1, 1] : 1 
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {Math.round(condition.probability)}%
                      </motion.p>
                      <div className="w-16 h-1 bg-black/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-current rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${condition.probability}%` }}
                          transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-muted-foreground text-center"
      >
        Analysis based on {weatherData.length} data points for {location.name}
      </motion.div>
    </motion.div>
  );
};

export default WeatherLikelihood;