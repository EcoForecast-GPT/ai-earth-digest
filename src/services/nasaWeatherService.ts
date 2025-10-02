// Weather Service using Supabase Edge Function
const SUPABASE_URL = "https://qxlcgekggsojggybchcz.supabase.co";
const WEATHER_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/get-weather`;

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
