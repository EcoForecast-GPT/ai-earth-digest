import { WeatherIntent } from './weather-nlp';

interface WeatherInsight {
  type: 'trend' | 'anomaly' | 'advisory' | 'comparison' | 'forecast';
  confidence: number;
  description: string;
  details: string;
  relevantMetrics: string[];
  suggestions?: string[];
}

interface ResponseTemplate {
  pattern: string;
  variables: string[];
  format: (values: Record<string, any>) => string;
}

const responseTemplates: Record<WeatherIntent['type'], ResponseTemplate[]> = {
  current: [
    {
      pattern: "Current conditions in {location}",
      variables: ['location', 'temperature', 'conditions'],
      format: (v) => `The current weather in ${v.location} shows ${v.temperature}°C with ${v.conditions.toLowerCase()}.`
    }
  ],
  forecast: [
    {
      pattern: "Weather forecast for {location}",
      variables: ['location', 'date', 'forecast'],
      format: (v) => `The forecast for ${v.location} on ${v.date} predicts ${v.forecast}.`
    }
  ],
  historical: [
    {
      pattern: "Historical weather analysis for {location}",
      variables: ['location', 'period', 'analysis'],
      format: (v) => `Looking at historical data for ${v.location} during ${v.period}: ${v.analysis}`
    }
  ],
  comparison: [
    {
      pattern: "Weather comparison between {location1} and {location2}",
      variables: ['location1', 'location2', 'differences'],
      format: (v) => `Comparing ${v.location1} with ${v.location2}: ${v.differences}`
    }
  ],
  trend: [
    {
      pattern: "Weather trend analysis for {location}",
      variables: ['location', 'period', 'trend'],
      format: (v) => `The weather trend in ${v.location} over ${v.period} shows: ${v.trend}`
    }
  ],
  advice: [
    {
      pattern: "Weather advice for {location}",
      variables: ['location', 'conditions', 'advice'],
      format: (v) => `Based on the weather in ${v.location} (${v.conditions}): ${v.advice}`
    }
  ]
};

export function generateEnhancedResponse(
  intent: WeatherIntent,
  weatherData: any,
  insights: WeatherInsight[],
  contextualData?: {
    recentLocations?: string[];
    commonConditions?: string[];
    relatedMetrics?: string[];
  }
): string {
  // Select appropriate template
  const templates = responseTemplates[intent.type];
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Generate main response
  const mainResponse = template.format(weatherData);

  // Add relevant insights
  const relevantInsights = insights
    .filter(i => i.confidence > 0.7)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  // Add contextual information
  let contextInfo = '';
  if (contextualData?.recentLocations?.length) {
    contextInfo = `\n\nInteresting comparison: Similar patterns have been observed in ${contextualData.recentLocations.join(', ')}.`;
  }

  // Build complete response
  let response = mainResponse;
  
  if (relevantInsights.length > 0) {
    response += '\n\nKey Insights:';
    relevantInsights.forEach(insight => {
      response += `\n• ${insight.description}`;
      if (insight.suggestions?.length) {
        response += `\n  Suggestion: ${insight.suggestions[0]}`;
      }
    });
  }

  if (contextInfo) {
    response += contextInfo;
  }

  return response;
}

export function analyzeWeatherTrends(
  historicalData: any[],
  currentData: any,
  location: string
): WeatherInsight[] {
  const insights: WeatherInsight[] = [];

  // Analyze temperature trends
  const tempTrend = analyzeTrend(historicalData.map(d => d.temperature));
  if (tempTrend.significance > 0.7) {
    insights.push({
      type: 'trend',
      confidence: tempTrend.significance,
      description: `Temperature ${tempTrend.direction} trend detected`,
      details: tempTrend.explanation,
      relevantMetrics: ['temperature']
    });
  }

  // Check for weather anomalies
  const anomalies = detectAnomalies(currentData, historicalData);
  anomalies.forEach(anomaly => {
    insights.push({
      type: 'anomaly',
      confidence: anomaly.confidence,
      description: anomaly.description,
      details: anomaly.details,
      relevantMetrics: anomaly.metrics,
      suggestions: anomaly.recommendations
    });
  });

  return insights;
}

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  significance: number;
  explanation: string;
}

function analyzeTrend(data: number[]): TrendAnalysis {
  // Simple linear regression
  const n = data.length;
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  
  let slope = 0;
  let sumSquaredErrors = 0;
  
  for (let i = 0; i < n; i++) {
    slope += (i - xMean) * (data[i] - yMean);
    sumSquaredErrors += Math.pow(i - xMean, 2);
  }
  
  slope /= sumSquaredErrors;
  
  const significance = Math.min(1, Math.abs(slope) * 10);
  
  return {
    direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
    significance,
    explanation: `${Math.abs(slope * 100).toFixed(1)}% change per period`
  };
}

interface Anomaly {
  confidence: number;
  description: string;
  details: string;
  metrics: string[];
  recommendations: string[];
}

function detectAnomalies(current: any, historical: any[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // Calculate historical statistics
  const stats = calculateStats(historical);
  
  // Check for temperature anomalies
  if (Math.abs(current.temperature - stats.temperature.mean) > 2 * stats.temperature.std) {
    anomalies.push({
      confidence: 0.9,
      description: 'Unusual temperature detected',
      details: `Current temperature is significantly ${current.temperature > stats.temperature.mean ? 'above' : 'below'} historical average`,
      metrics: ['temperature'],
      recommendations: [
        current.temperature > stats.temperature.mean 
          ? 'Consider heat protection measures'
          : 'Bundle up - temperatures are unusually low'
      ]
    });
  }
  
  return anomalies;
}

function calculateStats(data: any[]) {
  return {
    temperature: {
      mean: data.reduce((sum, d) => sum + d.temperature, 0) / data.length,
      std: Math.sqrt(
        data.reduce((sum, d) => sum + Math.pow(d.temperature - data.reduce((s, x) => s + x.temperature, 0) / data.length, 2), 0) / data.length
      )
    }
  };
}