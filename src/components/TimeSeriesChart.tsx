import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// This should match the output of our new nasaEarthdataService
interface TimeSeriesDataPoint {
  time: string;
  temperature?: number;
  precipitation?: number;
  humidity?: number;
  windSpeed?: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  selectedVars: string[];
  isLoading: boolean;
  error: string | null;
}

const TimeSeriesChart = ({
  data,
  selectedVars,
  isLoading,
  error,
}: TimeSeriesChartProps) => {
  // Debug: show incoming data in console to verify what chart receives
  console.debug('TimeSeriesChart props:', { length: data?.length, selectedVars, sample: data?.slice(0,5) });
  // Defensive guards
  const safeData: TimeSeriesDataPoint[] = Array.isArray(data) ? data : [];
  const safeSelectedVars: string[] = Array.isArray(selectedVars) && selectedVars.length > 0 ? selectedVars : ['temperature'];
  const getVariableColor = (variable: string) => {
    const colors: { [key: string]: string } = {
      temperature: "hsl(var(--primary))",
      precipitation: "#06b6d4", // cyan-500 fallback for visibility
      humidity: "#22c55e", // green-500
      windSpeed: "#f59e42", // orange-500
    };
    return colors[variable] || "hsl(var(--foreground))";
  };

  const getVariableUnit = (variable: string) => {
    const units: { [key: string]: string } = {
      temperature: "°C",
      precipitation: "mm/hr",
      humidity: "%",
      windSpeed: "m/s",
    };
    return units[variable] || "";
  };

  const formatXAxis = (tickItem: string) => {
    // If the timestamp is exactly midnight UTC, show date instead (daily series)
    const d = new Date(tickItem);
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) {
      return d.toLocaleDateString('en-US');
    }
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex flex-col items-center justify-center text-center text-red-400">
            <p className="font-semibold mb-2">Failed to load chart data.</p>
            <p className="text-xs text-muted-foreground font-mono bg-destructive/10 p-2 rounded">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No time-series data available for the selected period.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
            />
            {/* Compute axis domains so both lines are visible when scale differs */}
            {(() => {
              const leftVar = safeSelectedVars[0];
              const rightVar = safeSelectedVars[1];
              // Compute max using safeData and safe access
              const leftValues = safeData.map(d => (d as any)[leftVar]).filter(v => typeof v === 'number') as number[];
              const rightValues = rightVar ? safeData.map(d => (d as any)[rightVar]).filter(v => typeof v === 'number') as number[] : [];
              const leftMax = leftValues.length > 0 ? Math.max(...leftValues.map(Math.abs)) : 1;
              const rightMax = rightValues.length > 0 ? Math.max(...rightValues.map(Math.abs)) : undefined;

              return (
                <>
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}${getVariableUnit(leftVar)}`}
                    domain={[Math.min(0, -leftMax * 0.2), leftMax * 1.2]}
                  />
                  {rightVar && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}${getVariableUnit(rightVar)}`}
                      domain={[0, (rightMax ?? 1) * 1.2]}
                    />
                  )}
                </>
              );
            })()}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelFormatter={formatXAxis}
            />
            <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
            
            {/* Always render precipitation if present in data, even if not in selectedVars */}
            {['precipitation', ...safeSelectedVars.filter(v => v !== 'precipitation')].map((variable, index) => {
              // Only render if at least one data point has this variable
              const hasData = safeData.some(d => typeof d[variable as keyof TimeSeriesDataPoint] === 'number');
              if (!hasData) return null;
              return (
                <Line
                  key={variable}
                  yAxisId={variable === 'precipitation' ? 'right' : (index === 0 ? 'left' : 'right')}
                  type="monotone"
                  dataKey={variable}
                  stroke={getVariableColor(variable)}
                  strokeWidth={variable === 'precipitation' ? 3 : 2}
                  dot={false}
                  name={variable.charAt(0).toUpperCase() + variable.slice(1)}
                  unit={getVariableUnit(variable)}
                  strokeDasharray={variable === 'precipitation' ? '6 3' : undefined}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;