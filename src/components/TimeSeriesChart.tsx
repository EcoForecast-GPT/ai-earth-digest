import { HistoricalDataPoint } from "@/services/nasaApi";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/components/ThemeProvider";

interface TimeSeriesChartProps {
  data: HistoricalDataPoint[];
  isLoading: boolean;
}

const TimeSeriesChart = ({ data, isLoading }: TimeSeriesChartProps) => {
  const { theme } = useTheme();
  const colors = {
    temperature: "hsl(var(--primary))",
    precipitation: "hsl(var(--accent))",
    grid: theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    text: theme === 'dark' ? "#f8fafc" : "#020817",
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="p-6 h-96 flex items-center justify-center">
        <p className="text-muted-foreground">Loading historical data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 h-96 flex items-center justify-center">
        <p className="text-muted-foreground">No historical data available for this location.</p>
      </div>
    );
  }

  return (
    <Card className="p-6 glass-panel">
      <h3 className="text-lg font-semibold text-foreground mb-4">Historical Trends</h3>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              stroke={colors.text}
              tickFormatter={formatXAxis} 
              fontSize={12}
            />
            <YAxis yAxisId="left" stroke={colors.temperature} fontSize={12} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: colors.temperature }} />
            <YAxis yAxisId="right" orientation="right" stroke={colors.precipitation} fontSize={12} label={{ value: 'Precip (mm/hr)', angle: 90, position: 'insideRight', fill: colors.precipitation }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--background))", 
                borderColor: "hsl(var(--border))" 
              }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend wrapperStyle={{ fontSize: "14px" }} />
            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke={colors.temperature} dot={false} strokeWidth={2} name="Temperature" />
            <Line yAxisId="right" type="monotone" dataKey="precipitation" stroke={colors.precipitation} dot={false} strokeWidth={2} name="Precipitation" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TimeSeriesChart;