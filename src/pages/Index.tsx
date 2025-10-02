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
// ...InteractiveWeatherMap import removed
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useLocationIP } from "@/hooks/useLocationIP";
import { PlanetLoader } from "@/components/PlanetLoader";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { MinimalWeatherMenu } from "@/components/MinimalWeatherMenu";
import { fetchNASAWeatherData } from "@/services/nasaWeatherService";
import { fetchTimeSeriesData } from "@/services/nasaEarthdataService";
import ErrorBoundary from "@/components/ErrorBoundary";
import DebugPanel from "@/components/DebugPanel";
import WeatherControls from "@/components/WeatherControls";

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
    lat: 25.276987,
    lon: 55.296249,
    name: "Dubai, UAE"
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>("sunny");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [isTimeSeriesLoading, setIsTimeSeriesLoading] = useState(false);
  const [timeSeriesError, setTimeSeriesError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  // Date range for NASA trends
  const [trendStartDate, setTrendStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [trendEndDate, setTrendEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleTrendStartDateChange = (date: string) => {
    setTrendStartDate(date);
  };
  const handleTrendEndDateChange = (date: string) => {
    setTrendEndDate(date);
  };

  // Fetch single-point weather data
  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Only use NASA data for the selected date (future or past)
      const nasaData = await fetchNASAWeatherData(
        selectedLocation.lat,
        selectedLocation.lon,
        selectedDate
      );

      const data: WeatherData = {
        timestamp: selectedDate,
        temperature: nasaData.temperature,
        precipitation: nasaData.precipitation,
        humidity: nasaData.humidity,
        windSpeed: nasaData.windSpeed,
        pressure: nasaData.pressure,
        visibility: nasaData.visibility,
        uvIndex: nasaData.uvIndex,
        timeSeries: []
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


  // Fetch time-series data for the chart (NASA trends)
  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedLocation) return;
      setIsTimeSeriesLoading(true);
      setTimeSeriesError(null);
      try {
        const data = await fetchTimeSeriesData({
          lat: selectedLocation.lat,
          lon: selectedLocation.lon,
          startDate: trendStartDate,
          endDate: trendEndDate,
        });
        setTimeSeriesData(data);
        console.debug('Time series data set in Index:', data.slice(0, 10));
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
  }, [selectedLocation, trendStartDate, trendEndDate, toast]);

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

  // ...interactiveMapWidget removed

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

  const weatherControlsWidget = {
    id: 'weather-controls',
    title: 'Controls',
    component: (
      <WeatherControls
        location={selectedLocation}
        onLocationChange={handleLocationSelect}
        date={selectedDate}
        onDateChange={handleDateChange}
        isLoading={isLoading}
        onFetch={fetchWeatherData}
        weatherData={weatherData ? [weatherData] : []}
      />
    )
  };


  // Full-width Weather Trends widget with date range controls
  const weatherTrendsWidget = (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end gap-2 mb-2 w-full">
        <div className="flex flex-col md:flex-row md:items-end gap-2 w-full">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
            <input
              type="date"
              value={trendStartDate}
              max={trendEndDate}
              onChange={e => handleTrendStartDateChange(e.target.value)}
              className="glass-panel border border-border/30 rounded px-2 py-1 text-sm"
              style={{ minWidth: 120 }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
            <input
              type="date"
              value={trendEndDate}
              min={trendStartDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => handleTrendEndDateChange(e.target.value)}
              className="glass-panel border border-border/30 rounded px-2 py-1 text-sm"
              style={{ minWidth: 120 }}
            />
          </div>
        </div>
      </div>
      <TimeSeriesChart
        data={timeSeriesData}
        isLoading={isTimeSeriesLoading}
        error={timeSeriesError}
        selectedVars={['temperature', 'precipitation']}
      />
    </div>
  );

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
        <div className="w-full max-w-full mx-auto space-y-6">
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
            className="w-full"
          >
            {aiSummaryWidget.component}
          </motion.div>

          <div className="flex justify-end mb-2">
            <button onClick={() => setShowDebug(s => !s)} className="text-xs text-muted-foreground">Toggle Debug Panel</button>
          </div>

          {showDebug && <DebugPanel />}

          {/* Weather Trends - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full"
          >
            {weatherTrendsWidget}
          </motion.div>

          {/* Weather Controls - Full Width at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full mt-8"
          >
            <div className="max-w-7xl mx-auto">
              <div className="bg-card rounded-lg shadow-lg p-4 md:p-6 border border-border/30">
                {weatherControlsWidget.component}
              </div>
            </div>
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
                dateRange={{ start: selectedDate, end: selectedDate }}
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