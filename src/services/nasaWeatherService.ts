// Weather Service using Supabase Edge Function. Read the URL from environment so it works in deployment.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL not found in environment.');
}

const WEATHER_FUNCTION_URL = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/get-weather`;

export interface NASAWeatherData {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: 'very sunny' | 'sunny' | 'partly cloudy' | 'cloudy' | 'very cloudy' | 'rainy' | 'stormy';
}

export const fetchNASAWeatherData = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<NASAWeatherData> => {
  try {
    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}`);
    
    const response = await fetch(WEATHER_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ lat, lon })
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Weather data received:', data);
    
    return {
      temperature: data.temperature,
      precipitation: data.precipitation,
      humidity: data.humidity,
      windSpeed: data.windSpeed,
      pressure: data.pressure,
      visibility: data.visibility,
      uvIndex: data.uvIndex,
      condition: data.condition
    };
  } catch (error) {
    console.error('Error fetching NASA weather data:', error);
    throw error instanceof Error ? error : new Error('Unknown weather fetch error');
  }
};
