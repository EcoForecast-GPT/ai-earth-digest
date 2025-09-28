import { useState, useEffect } from "react";
import { WeatherLocation, WeatherData } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AISummaryCardProps {
  location: WeatherLocation;
  weatherData: WeatherData[];
  isLoading: boolean;
}

interface AISummary {
  summary: string;
  insights: string[];
  recommendations: string[];
}

const AISummaryCard = ({ location, weatherData, isLoading }: AISummaryCardProps) => {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock AI summary generation
  const generateSummary = async () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const avgTemp = weatherData.reduce((sum, d) => sum + d.temperature, 0) / weatherData.length;
    const avgPrecip = weatherData.reduce((sum, d) => sum + d.precipitation, 0) / weatherData.length;
    
    const mockSummary: AISummary = {
      summary: `Weather analysis for ${location.name} shows ${avgTemp > 20 ? 'warm' : 'cool'} conditions with average temperatures of ${avgTemp.toFixed(1)}°C. Precipitation patterns indicate ${avgPrecip > 25 ? 'high' : 'moderate'} rainfall activity across the selected period.`,
      insights: [
        `Temperature variance of ${Math.max(...weatherData.map(d => d.temperature)) - Math.min(...weatherData.map(d => d.temperature))}°C suggests ${Math.max(...weatherData.map(d => d.temperature)) - Math.min(...weatherData.map(d => d.temperature)) > 15 ? 'significant' : 'stable'} weather patterns`,
        `Peak precipitation events correlate with ${avgTemp > 18 ? 'convective' : 'frontal'} weather systems`,
        `Wind patterns show ${weatherData.some(d => d.windSpeed > 10) ? 'dynamic' : 'stable'} atmospheric conditions`
      ],
      recommendations: [
        avgTemp > 25 ? "Monitor heat stress indicators" : "Track frost risk periods",
        avgPrecip > 30 ? "Implement flood preparedness measures" : "Consider drought mitigation strategies",
        "Continue monitoring satellite imagery for system development"
      ]
    };
    
    setSummary(mockSummary);
    setIsGenerating(false);
  };

  useEffect(() => {
    if (weatherData.length > 0 && !isLoading) {
      generateSummary();
    }
  }, [location, weatherData.length, isLoading]);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
          AI Weather Intelligence
        </h3>
        
        <Button
          onClick={generateSummary}
          disabled={isGenerating}
          size="sm"
          variant="glass"
        >
          {isGenerating ? "Analyzing..." : "Refresh"}
        </Button>
      </div>

      {isGenerating ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground animate-pulse-glow">
              Gemini AI analyzing weather patterns...
            </p>
          </div>
        </div>
      ) : summary ? (
        <div className="flex-1 space-y-6">
          {/* AI Summary */}
          <Card className="glass-panel p-4">
            <h4 className="text-sm font-medium text-accent mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent rounded-full" />
              Summary
            </h4>
            <p className="text-sm text-foreground leading-relaxed">
              {summary.summary}
            </p>
          </Card>

          {/* Key Insights */}
          <Card className="glass-panel p-4">
            <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Key Insights
            </h4>
            <ul className="space-y-2">
              {summary.insights.map((insight, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </Card>

          {/* Recommendations */}
          <Card className="glass-panel p-4">
            <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {summary.recommendations.map((rec, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <div className="w-1 h-1 bg-destructive rounded-full mt-1.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            Select a location and date range to generate AI insights
          </p>
        </div>
      )}

      {/* AI Status Indicator */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-glow" />
          Powered by Gemini AI
        </div>
      </div>
    </div>
  );
};

export default AISummaryCard;