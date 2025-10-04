interface WeatherQuery {
  date?: Date;
  location?: string;
  coordinates?: { lat: number; lon: number };
  metrics: Array<'temperature' | 'precipitation' | 'humidity' | 'wind' | 'pressure' | 'condition'>;
  type: 'current' | 'forecast' | 'historical';
  naturalQuery: string;
}

const weatherMetrics = {
  temperature: [
    /temperature/i,
    /\b(?:hot|cold|warm|cool|heat|chill)\b/i,
    /\b(?:degrees?|°|celsius|fahrenheit)\b/i,
    /\bhow (?:hot|cold|warm|cool)\b/i
  ],
  precipitation: [
    /\brain\b/i,
    /\b(?:precipitation|rainfall|snow|hail|sleet)\b/i,
    /\b(?:wet|dry|drizzle|shower)\b/i,
    /\bwill it (?:rain|snow|precipitate)\b/i,
    /\bchance of (?:rain|snow|precipitation)\b/i
  ],
  humidity: [
    /humidity/i,
    /\b(?:humid|moisture|damp)\b/i,
    /\bhow (?:humid|dry)\b/i
  ],
  wind: [
    /\b(?:wind|windy|breeze|gust)\b/i,
    /\bwind ?speed\b/i,
    /\bhow (?:windy|breezy)\b/i
  ],
  pressure: [
    /\b(?:pressure|barometric|atmospheric)\b/i,
    /\bair pressure\b/i
  ],
  condition: [
    /\b(?:weather|condition|forecast)\b/i,
    /\b(?:sunny|cloudy|overcast|stormy)\b/i,
    /what(?:'s| is) (?:it|the weather) (?:like|going to be)\b/i
  ]
};

function parseWeatherQuery(text: string): WeatherQuery {
  const query: WeatherQuery = {
    metrics: [],
    type: 'current',
    naturalQuery: text
  };

  const normalized = text.toLowerCase();

  // Detect metrics
  for (const [metric, patterns] of Object.entries(weatherMetrics)) {
    if (patterns.some(pattern => pattern.test(normalized))) {
      query.metrics.push(metric as WeatherQuery['metrics'][0]);
    }
  }

  // If no specific metrics mentioned, include all
  if (query.metrics.length === 0) {
    query.metrics = ['temperature', 'precipitation', 'humidity', 'wind', 'condition'];
  }

  // Detect if it's about future, past, or current
  if (/(will|going to|expect|forecast|tomorrow|next|future)/i.test(normalized)) {
    query.type = 'forecast';
  } else if (/(was|yesterday|last|past|previous|history|historical)/i.test(normalized)) {
    query.type = 'historical';
  }

  return query;
}

function generateWeatherResponse(query: WeatherQuery, weatherData: any): string {
  let response = '';

  // Add time context
  if (query.date) {
    const dateStr = formatDate(query.date);
    response += `${query.type === 'forecast' ? '🔮 Forecast' : query.type === 'historical' ? '📊 Historical data' : '📍 Current conditions'} for ${dateStr}`;
    if (query.location) {
      response += ` in ${query.location}`;
    }
    response += ':\n\n';
  }

  // Add requested metrics
  for (const metric of query.metrics) {
    switch (metric) {
      case 'temperature':
        if (weatherData.temperature !== undefined) {
          response += `🌡️ Temperature: ${weatherData.temperature.toFixed(1)}°C\n`;
          if (weatherData.temperature > 35) {
            response += '(Very hot - stay hydrated and avoid midday sun)\n';
          } else if (weatherData.temperature < 10) {
            response += '(Cold - dress warmly)\n';
          }
        }
        break;

      case 'precipitation':
        if (weatherData.precipitation !== undefined) {
          response += `🌧️ Precipitation: ${weatherData.precipitation.toFixed(1)}mm/h\n`;
          if (weatherData.precipitation > 10) {
            response += '(Heavy rain expected - bring umbrella)\n';
          } else if (weatherData.precipitation > 0) {
            response += `(${weatherData.precipitation > 5 ? 'Moderate' : 'Light'} rain possible)\n`;
          }
        }
        break;

      case 'humidity':
        if (weatherData.humidity !== undefined) {
          response += `💧 Humidity: ${weatherData.humidity.toFixed(0)}%\n`;
          if (weatherData.humidity > 80) {
            response += '(Very humid - it may feel warmer than the temperature indicates)\n';
          } else if (weatherData.humidity < 30) {
            response += '(Very dry - stay hydrated)\n';
          }
        }
        break;

      case 'wind':
        if (weatherData.windSpeed !== undefined) {
          response += `💨 Wind Speed: ${weatherData.windSpeed.toFixed(1)} m/s\n`;
          if (weatherData.windSpeed > 15) {
            response += '(Strong winds - secure loose objects)\n';
          }
        }
        break;

      case 'pressure':
        if (weatherData.pressure !== undefined) {
          response += `🎈 Pressure: ${weatherData.pressure.toFixed(0)} hPa\n`;
        }
        break;

      case 'condition':
        if (weatherData.condition) {
          response += `🌤️ Condition: ${weatherData.condition}\n`;
        }
        break;
    }
  }

  // Add general advice based on conditions
  if (weatherData.temperature > 35 && weatherData.humidity > 70) {
    response += '\n⚠️ Heat stress warning: Very hot and humid conditions. Stay hydrated and avoid strenuous activities.';
  } else if (weatherData.precipitation > 20) {
    response += '\n⚠️ Heavy rain warning: Flooding possible. Stay informed about local conditions.';
  } else if (weatherData.temperature > 25 && weatherData.precipitation < 1 && weatherData.humidity < 40) {
    response += '\n☀️ Perfect weather for outdoor activities, but remember sun protection!';
  }

  return response;
}

import { formatDate } from './date-parser';
export { parseWeatherQuery, generateWeatherResponse, type WeatherQuery };