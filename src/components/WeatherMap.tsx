import { useEffect, useRef } from "react";
import { WeatherLocation } from "@/pages/Index";

interface WeatherMapProps {
  location: WeatherLocation;
  onLocationSelect: (location: WeatherLocation) => void;
}

const WeatherMap = ({ location, onLocationSelect }: WeatherMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  // Mock interactive map for now - in production this would use Mapbox
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Convert click position to approximate lat/lon (mock calculation)
    const newLat = 90 - (y * 180);
    const newLon = (x * 360) - 180;
    
    onLocationSelect({
      lat: newLat,
      lon: newLon,
      name: `Location ${newLat.toFixed(2)}, ${newLon.toFixed(2)}`
    });
  };

  return (
    <div className="p-6 h-full">
      <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
        Interactive Weather Map
      </h3>
      
      <div 
        ref={mapContainer}
        onClick={handleClick}
        className="relative w-full h-80 bg-gradient-to-br from-secondary/30 to-accent/20 rounded-lg border border-border/50 cursor-crosshair overflow-hidden"
      >
        {/* Mock satellite imagery overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-green-800/10 to-yellow-600/10 animate-aurora" />
        
        {/* Weather data points */}
        <div className="absolute inset-0">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-primary rounded-full animate-pulse-glow"
              style={{
                left: `${20 + (i * 10)}%`,
                top: `${30 + Math.sin(i) * 20}%`,
              }}
            />
          ))}
        </div>
        
        {/* Selected location marker */}
        <div
          className="absolute w-4 h-4 bg-accent rounded-full border-2 border-accent-foreground glow-accent"
          style={{
            left: `${((location.lon + 180) / 360) * 100}%`,
            top: `${((90 - location.lat) / 180) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Scanning line effect */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan opacity-60" />
        
        {/* Location info overlay */}
        <div className="absolute bottom-4 left-4 glass-panel rounded-lg p-3">
          <p className="text-sm font-medium text-foreground">{location.name}</p>
          <p className="text-xs text-muted-foreground">
            {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
          </p>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Click anywhere on the map to select a location
      </p>
    </div>
  );
};

export default WeatherMap;