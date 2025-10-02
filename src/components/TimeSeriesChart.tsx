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
}

const TimeSeriesChart = ({
  data,
  selectedVars,
  isLoading,
}: TimeSeriesChartProps) => {
  const getVariableColor = (variable: string) => {
    const colors: { [key: string]: string } = {
      temperature: "hsl(var(--primary))",
      precipitation: "hsl(var(--cyan-500))", // A different color for distinction
      humidity: "hsl(var(--green-500))",
      windSpeed: "hsl(var(--orange-500))",
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
    // Assuming tickItem is an ISO string, format to HH:MM
    return new Date(tickItem).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}${getVariableUnit(selectedVars[0])}`}
            />
            {selectedVars.length > 1 && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}${getVariableUnit(selectedVars[1])}`}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelFormatter={formatXAxis}
            />
            <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
            
            {selectedVars.map((variable, index) => (
              <Line
                key={variable}
                yAxisId={index === 0 ? "left" : "right"}
                type="monotone"
                dataKey={variable}
                stroke={getVariableColor(variable)}
                strokeWidth={2}
                dot={false}
                name={variable.charAt(0).toUpperCase() + variable.slice(1)}
                unit={getVariableUnit(variable)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;