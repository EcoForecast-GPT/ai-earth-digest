import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Bot } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import WeatherMap from "@/components/WeatherMap";
import WeatherControls from "@/components/WeatherControls";
import WeatherLikelihood from "@/components/WeatherLikelihood";
import DataExport from "@/components/DataExport";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import AISummaryCard from "@/components/AISummaryCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WeatherChatbot } from "@/components/WeatherChatbot";
import { InteractiveWeatherMap } from "@/components/InteractiveWeatherMap";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useLocationIP } from "@/hooks/useLocationIP";
import { PlanetLoader } from "@/components/PlanetLoader";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export interface WeatherLocation {
  lat: number;
  lon: number;
  name: string;
}

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "stormy" | "snowy" | "windy";

export interface WeatherData {
  timestamp: string;
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  timeSeries: Array<{
    time: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
    humidity: number;
  }>;
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
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>("sunny");
  const [showChatbot, setShowChatbot] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock weather data generator with auto-fetched variables
  const generateWeatherData = useCallback((location: WeatherLocation, date: Date): WeatherData => {
    const baseTemp = 20 + Math.sin(date.getMonth()) * 15;
    const timeSeries = Array.from({ length: 24 }, (_, hour) => ({
      time: `${hour.toString().padStart(2, '0')}:00`,
      temperature: baseTemp + Math.sin(hour / 4) * 8 + Math.random() * 4,
      precipitation: Math.random() * 20,
      windSpeed: 5 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
    }));

    return {
      timestamp: date.toISOString(),
      temperature: baseTemp + Math.random() * 10,
      precipitation: Math.random() * 50,
      humidity: 60 + Math.random() * 30,
      windSpeed: 8 + Math.random() * 12,
      pressure: 1013 + Math.random() * 20 - 10,
      visibility: 8 + Math.random() * 7,
      uvIndex: Math.max(0, Math.min(11, 6 + Math.sin(date.getHours() / 24 * Math.PI * 2) * 5)),
      timeSeries
    };
  }, []);

  // Auto-fetch weather data
  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = generateWeatherData(selectedLocation, selectedDate);
      setWeatherData(data);
      
      // Determine weather condition based on data
      if (data.precipitation > 30) {
        setWeatherCondition("rainy");
      } else if (data.windSpeed > 15) {
        setWeatherCondition("windy");
      } else if (data.temperature > 30) {
        setWeatherCondition("sunny");
      } else if (data.temperature < 10) {
        setWeatherCondition("snowy");
      } else {
        setWeatherCondition("cloudy");
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch weather data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation, selectedDate, generateWeatherData, toast]);

  // Auto-fetch weather data when location or date changes
  useEffect(() => {
    fetchWeatherData();
  }, [selectedLocation, selectedDate, fetchWeatherData]);

  // Update location when auto-location is available - only once per location change
  useEffect(() => {
    if (autoLocation && !locationLoading) {
      // Only update if the location actually changed
      if (selectedLocation.lat !== autoLocation.lat || selectedLocation.lon !== autoLocation.lon) {
        setSelectedLocation({
          lat: autoLocation.lat,
          lon: autoLocation.lon,
          name: autoLocation.name
        });
        
        if (autoLocation.source === 'gps') {
          toast({
            title: "Location detected",
            description: `Using GPS location: ${autoLocation.name}`,
          });
        } else if (autoLocation.source === 'ip') {
          toast({
            title: "Location detected",
            description: `Using IP location: ${autoLocation.name}`,
          });
        }
      }
    }
  }, [autoLocation?.lat, autoLocation?.lon, locationLoading]); // Only depend on lat/lon changes

  const handleLocationSelect = useCallback((location: WeatherLocation) => {
    setSelectedLocation(location);
    // Don't call updateLocation to avoid loops
    toast({
      title: "Location updated",
      description: `Now showing weather for ${location.name}`,
    });
  }, [toast]);

  // Create widgets for responsive layout
  const widgets = [
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
      priority: 10,
      minHeight: 200,
    },
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
      priority: 9,
      minHeight: 300,
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
    {
      id: 'data-export',
      title: 'Data Export',
      component: (
        <DataExport 
          weatherData={weatherData ? [weatherData] : []}
          location={selectedLocation}
          dateRange={{ start: selectedDate.toISOString().split('T')[0], end: selectedDate.toISOString().split('T')[0] }}
        />
      ),
      priority: 6,
      minHeight: 200,
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
            alt="ClimaCast Logo" 
            className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border-2 border-primary/30"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">EcoForecast</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Smart Weather Forecasting</p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge variant="outline" className="glass-card border-primary/30 text-primary text-xs md:text-sm">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">{selectedLocation.name}</span>
              <span className="sm:hidden">{selectedLocation.name.split(',')[0]}</span>
            </Badge>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowChatbot(!showChatbot)}
              className="glass-card border-primary/30 hover:bg-primary/20"
            >
              <Bot className="w-4 h-4 text-primary" />
            </Button>
          </motion.div>
          
          <ThemeToggle />
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 md:mb-8"
          >
            <WeatherControls
              location={selectedLocation}
              onLocationChange={handleLocationSelect}
              dateRange={{ start: selectedDate.toISOString().split('T')[0], end: selectedDate.toISOString().split('T')[0] }}
              onDateRangeChange={(range) => setSelectedDate(new Date(range.start))}
              isLoading={isLoading}
              onFetch={fetchWeatherData}
              weatherData={weatherData ? [weatherData] : []}
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
        </div>
      </main>

      {/* Weather Chatbot */}
      <AnimatePresence>
        {showChatbot && (
          <WeatherChatbot 
            weatherData={weatherData}
            location={selectedLocation.name}
          />
        )}
      </AnimatePresence>

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