import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpg";
import { useToast } from "@/hooks/use-toast";
import WeatherLikelihood from "@/components/WeatherLikelihood";
import DataExport from "@/components/DataExport";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WeatherChatbot } from "@/components/WeatherChatbot";
import { InteractiveWeatherMap } from "@/components/InteractiveWeatherMap";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { PlanetLoader } from "@/components/PlanetLoader";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { MinimalWeatherMenu } from "@/components/MinimalWeatherMenu";
import { fetchNASAWeatherData, fetchNASAHistoricalData, HistoricalDataPoint } from "@/services/nasaApi";

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
}

const Index = () => {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation>({
    lat: 25.05,
    lon: 55.13,
    name: "Dubai, UAE"
  });
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>('sunny');
  const [isCurrentWeatherLoading, setIsCurrentWeatherLoading] = useState(true);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(true);

  const fetchCurrentWeatherData = useCallback(async () => {
    setIsCurrentWeatherLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nasaData = await fetchNASAWeatherData(selectedLocation.lat, selectedLocation.lon, today, today);
      const data: WeatherData = { timestamp: new Date().toISOString(), ...nasaData };
      setWeatherData(data);
      setWeatherCondition(nasaData.condition || 'sunny');
    } catch (error) {
      setWeatherData(null);
      toast({ title: "Error Fetching Current Weather", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsCurrentWeatherLoading(false);
    }
  }, [selectedLocation, toast]);

  const fetchHistoricalWeatherData = useCallback(async () => {
    setIsHistoricalLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
      const historical = await fetchNASAHistoricalData(
        selectedLocation.lat, 
        selectedLocation.lon, 
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setHistoricalData(historical);
    } catch (error) {
      setHistoricalData([]);
      toast({ title: "Error Fetching Historical Data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsHistoricalLoading(false);
    }
  }, [selectedLocation, toast]);

  useEffect(() => {
    fetchCurrentWeatherData();
    fetchHistoricalWeatherData();
  }, [fetchCurrentWeatherData, fetchHistoricalWeatherData]);

  const handleLocationSelect = useCallback((location: WeatherLocation) => {
    setSelectedLocation(location);
    toast({ title: "Location Updated", description: `Fetching new weather data...` });
  }, [toast]);

  const widgets = [
    { id: 'weather-likelihood', title: 'Weather Likelihood', component: <WeatherLikelihood location={selectedLocation} weatherData={weatherData ? [weatherData] : []} isLoading={isCurrentWeatherLoading} />, priority: 10, minHeight: 300 },
    { id: 'weather-chart', title: 'Weather Trends (1 Year)', component: <TimeSeriesChart data={historicalData} isLoading={isHistoricalLoading} />, priority: 8, minHeight: 400 },
    { id: 'weather-map', title: 'Interactive Map', component: <InteractiveWeatherMap location={selectedLocation} onLocationSelect={handleLocationSelect} />, priority: 7, minHeight: 400 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <header className="relative z-10 p-4 md:p-6 flex items-center justify-between border-b border-border/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src={logo} alt="EcoForecast Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border-2 border-primary/30" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-primary">EcoForecast</h1>
            <p className="text-xs md:text-sm text-muted-foreground">NASA-Powered Weather Intelligence</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <MinimalWeatherMenu location={selectedLocation} temperature={weatherData?.temperature ?? 0} condition={weatherCondition} isLoading={isCurrentWeatherLoading} />
          <ResponsiveLayout widgets={widgets} />
          {weatherData && <DataExport weatherData={[weatherData]} location={selectedLocation} dateRange={{ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] }} />}
        </div>
      </main>

      <WeatherChatbot weatherData={weatherData} historicalData={historicalData} location={selectedLocation.name} />

      <AnimatePresence>
        {(isCurrentWeatherLoading || isHistoricalLoading) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/90 flex items-center justify-center z-50">
            <div className="text-center">
              <PlanetLoader />
              <p className="text-sm text-primary mt-4 font-medium">
                {isCurrentWeatherLoading ? 'Loading current weather...' : 'Loading historical data...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;