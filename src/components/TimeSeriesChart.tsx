import { useEffect, useRef } from "react";
import { WeatherData } from "@/pages/Index";
import { Card } from "@/components/ui/card";

interface TimeSeriesChartProps {
  data: WeatherData[];
  selectedVars: string[];
  isLoading: boolean;
}

const TimeSeriesChart = ({ data, selectedVars, isLoading }: TimeSeriesChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  const getVariableColor = (variable: string) => {
    const colors = {
      temperature: "hsl(var(--primary))",
      precipitation: "hsl(var(--accent))",
      humidity: "hsl(var(--glow-secondary))",
      windSpeed: "hsl(var(--destructive))"
    };
    return colors[variable as keyof typeof colors] || "hsl(var(--foreground))";
  };

  const getVariableUnit = (variable: string) => {
    const units = {
      temperature: "°C",
      precipitation: "mm",
      humidity: "%",
      windSpeed: "m/s"
    };
    return units[variable as keyof typeof units] || "";
  };

  // Mock chart rendering - in production this would use Chart.js
  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up dimensions
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    // Draw grid
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i * width) / 10;
      const y = padding + (i * height) / 10;
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
    }

    // Draw data lines
    selectedVars.forEach((variable, varIndex) => {
      ctx.strokeStyle = getVariableColor(variable);
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * width;
        const value = point[variable as keyof WeatherData] as number;
        const normalizedValue = (value - Math.min(...data.map(d => d[variable as keyof WeatherData] as number))) / 
                               (Math.max(...data.map(d => d[variable as keyof WeatherData] as number)) - 
                                Math.min(...data.map(d => d[variable as keyof WeatherData] as number)));
        const y = padding + height - (normalizedValue * height);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });

  }, [data, selectedVars]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
          Time Series Analysis
        </h3>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
            <span className="text-sm">Processing NASA data...</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {selectedVars.map((variable) => (
          <div key={variable} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getVariableColor(variable) }}
            />
            <span className="text-sm capitalize text-foreground">
              {variable} {getVariableUnit(variable)}
            </span>
          </div>
        ))}
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={chartRef}
          width={800}
          height={400}
          className="w-full h-80 glass-panel rounded-lg"
        />
        
        {/* Data overlay effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 right-4 glass-panel rounded p-2">
            <p className="text-xs text-muted-foreground">
              {data.length} data points
            </p>
          </div>
        </div>
      </div>

      {/* Chart annotations */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {selectedVars.slice(0, 3).map((variable) => {
          const values = data.map(d => d[variable as keyof WeatherData] as number);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const max = Math.max(...values);
          const min = Math.min(...values);
          
          return (
            <Card key={variable} className="glass-panel p-3">
              <h4 className="text-sm font-medium capitalize text-foreground mb-2">
                {variable}
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Avg: {avg.toFixed(1)}{getVariableUnit(variable)}</div>
                <div>Max: {max.toFixed(1)}{getVariableUnit(variable)}</div>
                <div>Min: {min.toFixed(1)}{getVariableUnit(variable)}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSeriesChart;