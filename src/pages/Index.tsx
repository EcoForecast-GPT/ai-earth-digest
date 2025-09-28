import { useState } from "react";
import WeatherMap from "@/components/WeatherMap";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import AISummaryCard from "@/components/AISummaryCard";
import WeatherControls from "@/components/WeatherControls";
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
  
  const [selectedVars, setSelectedVars] = useState(["temperature", "precipitation"]);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      {/* Header */}
      <header className="mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-aurora mb-2 animate-pulse-glow">
            WeatherGPT
          </h1>
          <p className="text-muted-foreground text-lg">
            Advanced weather intelligence powered by NASA data and AI
          </p>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <Card className="lg:col-span-3 glass-card glow-primary">
          <WeatherControls
            location={selectedLocation}
            onLocationChange={setSelectedLocation}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedVars={selectedVars}
            onVarsChange={setSelectedVars}
            isLoading={isLoading}
            onFetch={() => setIsLoading(!isLoading)}
          />
        </Card>

        {/* Interactive Map */}
        <Card className="lg:col-span-5 glass-card">
          <WeatherMap
            location={selectedLocation}
            onLocationSelect={setSelectedLocation}
          />
        </Card>

        {/* AI Summary */}
        <Card className="lg:col-span-4 glass-card glow-accent">
          <AISummaryCard
            location={selectedLocation}
            weatherData={mockWeatherData}
            isLoading={isLoading}
          />
        </Card>

        {/* Time Series Charts */}
        <Card className="lg:col-span-12 glass-card chart-glow">
          <TimeSeriesChart
            data={mockWeatherData}
            selectedVars={selectedVars}
            isLoading={isLoading}
          />
        </Card>
      </div>

      {/* Floating Data Stream Effect */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent data-stream" />
    </div>
  );
};

export default Index;