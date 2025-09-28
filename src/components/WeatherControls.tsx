import { useState } from "react";
import { WeatherLocation } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface WeatherControlsProps {
  location: WeatherLocation;
  onLocationChange: (location: WeatherLocation) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  selectedVars: string[];
  onVarsChange: (vars: string[]) => void;
  isLoading: boolean;
  onFetch: () => void;
}

interface WeatherVariable {
  id: string;
  label: string;
  description: string;
}

const weatherVariables: WeatherVariable[] = [
  { id: "temperature", label: "Temperature", description: "Air temperature (°C)" },
  { id: "precipitation", label: "Precipitation", description: "Rainfall amount (mm)" },
  { id: "humidity", label: "Humidity", description: "Relative humidity (%)" },
  { id: "windSpeed", label: "Wind Speed", description: "Wind velocity (m/s)" },
  { id: "pressure", label: "Pressure", description: "Atmospheric pressure (hPa)" },
  { id: "cloudCover", label: "Cloud Cover", description: "Cloud coverage (%)" }
];

const presetLocations: WeatherLocation[] = [
  { lat: 40.7128, lon: -74.0060, name: "New York City" },
  { lat: 51.5074, lon: -0.1278, name: "London" },
  { lat: 35.6762, lon: 139.6503, name: "Tokyo" },
  { lat: -33.8688, lon: 151.2093, name: "Sydney" },
  { lat: 55.7558, lon: 37.6176, name: "Moscow" }
];

const WeatherControls = ({
  location,
  onLocationChange,
  dateRange,
  onDateRangeChange,
  selectedVars,
  onVarsChange,
  isLoading,
  onFetch
}: WeatherControlsProps) => {
  const [customLocation, setCustomLocation] = useState("");

  const handleVariableChange = (variableId: string, checked: boolean) => {
    if (checked) {
      onVarsChange([...selectedVars, variableId]);
    } else {
      onVarsChange(selectedVars.filter(v => v !== variableId));
    }
  };

  const handleCustomLocationSubmit = () => {
    if (customLocation.trim()) {
      // Simple parsing for lat,lon format
      const coords = customLocation.split(',').map(s => parseFloat(s.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        onLocationChange({
          lat: coords[0],
          lon: coords[1],
          name: `Custom (${coords[0]}, ${coords[1]})`
        });
        setCustomLocation("");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
        Weather Controls
      </h3>

      {/* Location Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Location</Label>
        
        {/* Preset Locations */}
        <div className="space-y-2">
          {presetLocations.map((preset) => (
            <Button
              key={preset.name}
              variant={location.name === preset.name ? "glow" : "glass"}
              size="sm"
              onClick={() => onLocationChange(preset)}
              className="w-full justify-start text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>

        {/* Custom Location */}
        <div className="flex gap-2">
          <Input
            placeholder="Lat, Lon (e.g. 40.7, -74.0)"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            className="glass-panel"
            onKeyPress={(e) => e.key === 'Enter' && handleCustomLocationSubmit()}
          />
          <Button 
            size="sm" 
            onClick={handleCustomLocationSubmit}
            variant="glass"
          >
            Set
          </Button>
        </div>

        {/* Current Location Display */}
        <Card className="glass-panel p-3">
          <p className="text-xs font-medium text-foreground">{location.name}</p>
          <p className="text-xs text-muted-foreground">
            {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
          </p>
        </Card>
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Date Range</Label>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
              className="glass-panel"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
              className="glass-panel"
            />
          </div>
        </div>
      </div>

      {/* Variable Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Variables</Label>
        <div className="space-y-3">
          {weatherVariables.map((variable) => (
            <div key={variable.id} className="flex items-start space-x-3 glass-panel p-3 rounded-lg">
              <Checkbox
                id={variable.id}
                checked={selectedVars.includes(variable.id)}
                onCheckedChange={(checked) => handleVariableChange(variable.id, !!checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor={variable.id}
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  {variable.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {variable.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fetch Button */}
      <Button
        onClick={onFetch}
        disabled={isLoading || selectedVars.length === 0}
        variant="glow"
        className="w-full"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Fetching NASA Data...
          </div>
        ) : (
          "Fetch Weather Data"
        )}
      </Button>

      {/* Data Source Info */}
      <Card className="glass-panel p-3">
        <p className="text-xs font-medium text-foreground mb-2">Data Sources</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• NASA GES DISC</li>
          <li>• Giovanni</li>
          <li>• Worldview</li>
          <li>• Earthdata Search</li>
        </ul>
      </Card>
    </div>
  );
};

export default WeatherControls;