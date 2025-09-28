import { useState } from "react";
import { motion } from "framer-motion";
import WeatherMap from "@/components/WeatherMap";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import AISummaryCard from "@/components/AISummaryCard";
import WeatherControls from "@/components/WeatherControls";
import WeatherBackground from "@/components/WeatherBackground";
import WeatherLikelihood from "@/components/WeatherLikelihood";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";

export interface WeatherLocation {
  lat: number;
  lon: number;
  name: string;
}

export interface WeatherData {
  timestamp: string;
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

const Index = () => {
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation>({
    lat: 40.7128,
    lon: -74.0060,
    name: "New York City"
  });
  
  const [dateRange, setDateRange] = useState({
    start: "2024-01-01",
    end: "2024-01-31"
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Mock weather data for demonstration
  const mockWeatherData: WeatherData[] = Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(2024, 0, i + 1).toISOString(),
    temperature: 20 + Math.sin(i / 5) * 10 + Math.random() * 5,
    precipitation: Math.random() * 50,
    humidity: 60 + Math.random() * 30,
    windSpeed: 5 + Math.random() * 15
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4 relative overflow-hidden">
      {/* Weather-based Background Animation */}
      <WeatherBackground weatherData={mockWeatherData} />
      
      {/* Header */}
      <motion.header 
        className="mb-8 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-aurora mb-2"
              animate={{ 
                textShadow: [
                  '0 0 10px hsl(var(--aurora))',
                  '0 0 20px hsl(var(--aurora))',
                  '0 0 10px hsl(var(--aurora))'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              WeatherGPT
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-lg md:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              AI-powered weather intelligence with NASA satellite data
            </motion.p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <ThemeToggle />
          </motion.div>
        </div>
      </motion.header>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Controls Panel */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="glass-card glow-primary hover:glow-accent transition-all duration-500 hover:scale-[1.02]">
            <WeatherControls
              location={selectedLocation}
              onLocationChange={setSelectedLocation}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              isLoading={isLoading}
              onFetch={() => setIsLoading(!isLoading)}
              weatherData={mockWeatherData}
            />
          </Card>
        </motion.div>

        {/* Interactive Map */}
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card className="glass-card hover:glow-primary transition-all duration-500 hover:scale-[1.01]">
            <WeatherMap
              location={selectedLocation}
              onLocationSelect={setSelectedLocation}
            />
          </Card>
        </motion.div>

        {/* Weather Likelihood Panel */}
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Card className="glass-card glow-accent hover:glow-secondary transition-all duration-500 hover:scale-[1.02] h-full">
            <div className="p-6">
              <WeatherLikelihood
                location={selectedLocation}
                weatherData={mockWeatherData}
                isLoading={isLoading}
              />
            </div>
          </Card>
        </motion.div>

        {/* AI Summary - Moved to second row */}
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <Card className="glass-card glow-secondary hover:glow-accent transition-all duration-500 hover:scale-[1.01]">
            <AISummaryCard
              location={selectedLocation}
              weatherData={mockWeatherData}
              isLoading={isLoading}
            />
          </Card>
        </motion.div>

        {/* Time Series Charts */}
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Card className="glass-card chart-glow hover:glow-primary transition-all duration-500 hover:scale-[1.01]">
            <TimeSeriesChart
              data={mockWeatherData}
              selectedVars={["temperature", "precipitation", "humidity", "windSpeed"]}
              isLoading={isLoading}
            />
          </Card>
        </motion.div>
      </div>

      {/* Floating Data Stream Effect */}
      <motion.div 
        className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 100%',
        }}
      />

      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-aurora/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;