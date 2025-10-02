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
import { fetchTimeSeriesData } from "@/services/nasaEarthdataService";
import ErrorBoundary from "@/components/ErrorBoundary";
import DebugPanel from "@/components/DebugPanel";

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
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [isTimeSeriesLoading, setIsTimeSeriesLoading] = useState(false);
  const [timeSeriesError, setTimeSeriesError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Fetch single-point weather data
  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = selectedDate.toISOString().split('T')[0];
      const endDate = selectedDate.toISOString().split('T')[0];
      
      const nasaData = await fetchNASAWeatherData(
        selectedLocation.lat,
        selectedLocation.lon,
        startDate,
        endDate
      );
      
      // Generate time series data based on NASA data
      const timeSeries = Array.from({ length: 24 }, (_, hour) => ({
        time: `${hour.toString().padStart(2, '0')}:00`,
        temperature: nasaData.temperature + Math.sin(hour / 4) * 5,
        precipitation: nasaData.precipitation * (Math.random() * 0.5 + 0.5),
        windSpeed: nasaData.windSpeed + Math.random() * 3,
        humidity: nasaData.humidity + Math.random() * 10 - 5,
      }));

      const data: WeatherData = {
        timestamp: selectedDate.toISOString(),
        temperature: nasaData.temperature,
        precipitation: nasaData.precipitation,
        humidity: nasaData.humidity,
        windSpeed: nasaData.windSpeed,
        pressure: nasaData.pressure,
        visibility: nasaData.visibility,
        uvIndex: nasaData.uvIndex,
        timeSeries
      };
      
      setWeatherData(data);
      
      // Set weather condition from NASA data
      const conditionMap: { [key: string]: WeatherCondition } = {
        'very sunny': 'sunny',
        'sunny': 'sunny',
        'partly cloudy': 'cloudy',
        'cloudy': 'cloudy',
        'very cloudy': 'cloudy',
        'rainy': 'rainy',
        'stormy': 'stormy'
      };
      setWeatherCondition(conditionMap[nasaData.condition] || 'sunny');
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch NASA weather data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation, selectedDate, toast]);

  // Fetch time-series data for the chart
  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedLocation) return;

      setIsTimeSeriesLoading(true);
      setTimeSeriesError(null);
      try {
        const endDate = selectedDate;
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7); // Fetch last 7 days

        const data = await fetchTimeSeriesData({
          lat: selectedLocation.lat,
          lon: selectedLocation.lon,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        });
        setTimeSeriesData(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
          title: "Error fetching time-series data",
          description: "Could not load data for the trends chart.",
          variant: "destructive",
        });
        setTimeSeriesError(errorMessage);
        setTimeSeriesData([]); // Clear data on error
      } finally {
        setIsTimeSeriesLoading(false);
      }
    };

    fetchChartData();
  }, [selectedLocation, selectedDate, toast]);

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
  const aiSummaryWidget = {
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
  };

  const interactiveMapWidget = {
    id: 'interactive-map',
    title: 'Interactive Map',
    component: (
      <ErrorBoundary fallback={<div className="text-red-500">Error loading map. Please check configuration.</div>}>
        <InteractiveWeatherMap 
          location={selectedLocation}
          onLocationSelect={handleLocationSelect}
        />
      </ErrorBoundary>
    )
  };

  const likelihoodWidget = {
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
  };

  const otherWidgets = [
    {
      id: 'weather-trends',
      title: 'Weather Trends (Last 7 Days)',
      component: (
        <TimeSeriesChart 
          data={timeSeriesData} 
          isLoading={isTimeSeriesLoading}
          error={timeSeriesError}
          selectedVars={['temperature', 'precipitation']}
        />
      )
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
              temperature={weatherData?.temperature}
              condition={weatherCondition}
              isLoading={isLoading}
            />
          </motion.div>

          {/* AI Summary - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {aiSummaryWidget.component}
          </motion.div>

          <div className="flex justify-end mb-2">
            <button onClick={() => setShowDebug(s => !s)} className="text-xs text-muted-foreground">Toggle Debug Panel</button>
          </div>

          {showDebug && <DebugPanel />}

          {/* Responsive Widget Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ResponsiveLayout widgets={[interactiveMapWidget, likelihoodWidget, ...otherWidgets]} />
          </motion.div>

          {/* Data Export at Bottom */}
          {weatherData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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