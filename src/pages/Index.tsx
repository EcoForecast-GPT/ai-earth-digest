import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpg";
import { useToast } from "@/hooks/use-toast";
import WeatherLikelihood from "@/components/WeatherLikelihood";
import DataExport from "@/components/DataExport";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import AISummaryCard from "@/components/AISummaryCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingChatInput } from "@/components/FloatingChatInput";
import { InteractiveWeatherMap } from "@/components/InteractiveWeatherMap";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useLocationIP } from "@/hooks/useLocationIP";
import { PlanetLoader } from "@/components/PlanetLoader";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { MinimalWeatherMenu } from "@/components/MinimalWeatherMenu";
import { fetchNASAWeatherData } from "@/services/nasaWeatherService";

export interface WeatherLocation {
  lat: number;
  lon: number;
  name: string;
}

export type WeatherCondition = 'very sunny' | 'sunny' | 'partly cloudy' | 'cloudy' | 'very cloudy' | 'rainy' | 'stormy';

export interface WeatherData {
  timestamp: string;
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
}

const Index = () => {
  const { toast } = useToast();
  const { location: autoLocation, isLoading: locationLoading, updateLocation } = useLocationIP();
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation>({
    lat: 40.7128,
    lon: -74.0060,
    name: "New York, NY"
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>('sunny');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real NASA weather data
  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = selectedDate.toISOString().split('T')[0];
      const endDate = selectedDate.toISOString().split('T')[0];
      
      const nasaData = await fetchNASAWeatherData(
        selectedLocation.lat,
        selectedLocation.lon,
        startDate,
        endDate,
        "XjsdXPro2vh4bNJe9sv2PWNGGSBcv72Z74HDnsJG"
      );
      
      const data: WeatherData = {
        timestamp: selectedDate.toISOString(),
        ...nasaData
      };
      
      setWeatherData(data);
      
      // Set weather condition from NASA data
      setWeatherCondition(nasaData.condition || 'sunny');
      
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to fetch NASA weather data. The location may not be supported.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation, selectedDate, toast]);

  // Auto-fetch weather data when location or date changes
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // Update location when auto-location is available
  useEffect(() => {
    if (autoLocation && !locationLoading) {
      if (selectedLocation.lat !== autoLocation.lat || selectedLocation.lon !== autoLocation.lon) {
        setSelectedLocation({
          lat: autoLocation.lat,
          lon: autoLocation.lon,
          name: autoLocation.name
        });
        
        toast({
          title: "Location detected",
          description: `Using ${autoLocation.source === 'gps' ? 'GPS' : 'IP'} location: ${autoLocation.name}`,
        });
      }
    }
  }, [autoLocation, locationLoading, selectedLocation.lat, selectedLocation.lon, toast]);

  const handleLocationSelect = useCallback((location: WeatherLocation) => {
    setSelectedLocation(location);
    // Don't call updateLocation to avoid loops
    toast({
      title: "Location updated",
      description: `Now showing weather for ${location.name}`,
    });
  }, [toast]);

  // Create widgets for responsive layout - AI Summary is now second
  const widgets = [
    {
      id: 'weather-likelihood',
      title: 'Weather Likelihood',
      component: (
        <WeatherLikelihood 
          location={selectedLocation}
          weatherData={weatherData ? [weatherData] : []}
          isLoading={isLoading}
        />
      ),
      priority: 10,
      minHeight: 300,
    },
    {
      id: 'ai-summary',
      title: 'AI Weather Analysis',
      component: (
        <AISummaryCard 
          location={selectedLocation}
          weatherData={weatherData ? [weatherData] : []}
          isLoading={isLoading}
        />
      ),
      priority: 9,
      minHeight: 200,
    },
    {
      id: 'weather-chart',
      title: 'Weather Trends',
      component: <TimeSeriesChart data={weatherData ? [weatherData] : []} selectedVars={["temperature", "precipitation"]} isLoading={isLoading} />,
      priority: 8,
      minHeight: 400,
    },
    {
      id: 'weather-map',
      title: 'Interactive Map',
      component: (
        <InteractiveWeatherMap 
          location={selectedLocation}
          onLocationSelect={handleLocationSelect}
        />
      ),
      priority: 7,
      minHeight: 400,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 md:p-6 flex items-center justify-between border-b border-border/20 backdrop-blur-sm"
      >
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
        >
          <img 
            src={logo} 
            alt="EcoForecast Logo" 
            className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border-2 border-primary/30"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">EcoForecast</h1>
            <p className="text-xs md:text-sm text-muted-foreground">NASA-Powered Weather Intelligence</p>
          </div>
        </motion.div>
        
        <ThemeToggle />
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Minimal Weather Menu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MinimalWeatherMenu
              location={selectedLocation}
              temperature={weatherData?.temperature ?? 0}
              condition={weatherCondition}
              isLoading={isLoading}
            />
          </motion.div>

          {/* Responsive Widget Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ResponsiveLayout widgets={widgets} />
          </motion.div>

          {/* Data Export at Bottom */}
          {weatherData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <DataExport 
                weatherData={[weatherData]}
                location={selectedLocation}
                dateRange={{ start: selectedDate.toISOString().split('T')[0], end: selectedDate.toISOString().split('T')[0] }}
              />
            </motion.div>
          )}
        </div>
      </main>

      {/* Floating Chat Input */}
      <FloatingChatInput 
        weatherData={weatherData}
        location={selectedLocation.name}
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {(isLoading || locationLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 flex items-center justify-center z-50"
          >
            <motion.div className="text-center">
              <PlanetLoader />
              <p className="text-sm text-primary mt-4 font-medium">
                {locationLoading ? 'Detecting location...' : 'Loading weather data...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;