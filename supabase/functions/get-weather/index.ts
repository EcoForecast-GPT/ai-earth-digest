import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: 'very sunny' | 'sunny' | 'partly cloudy' | 'cloudy' | 'very cloudy' | 'rainy' | 'stormy';
}

const codeToCondition = (code: number): WeatherData['condition'] => {
  if (code >= 95 && code <= 99) return 'stormy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 61 && code <= 67) return 'rainy';
  if (code >= 51 && code <= 57) return 'rainy';
  if (code >= 3) return 'very cloudy';
  if (code === 2) return 'cloudy';
  if (code === 1) return 'partly cloudy';
  return 'sunny';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon, date } = await req.json();
    
    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Missing lat or lon parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}, date: ${date}`);

    let openMeteoUrl;
    const requestedDate = date ? new Date(date) : null;
    const now = new Date();
    now.setHours(0,0,0,0);

    if (requestedDate) {
      requestedDate.setHours(0,0,0,0);
      const dateString = requestedDate.toISOString().split('T')[0];
      if (requestedDate >= now) {
        // Future or today
        openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&timezone=auto&start_date=${dateString}&end_date=${dateString}`;
      } else {
        // Past date
        openMeteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&timezone=auto&start_date=${dateString}&end_date=${dateString}`;
      }
    } else {
      // Current weather
      openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=uv_index_max&timezone=auto`;
    }
    
    const response = await fetch(openMeteoUrl);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Open-Meteo response:', JSON.stringify(data));

    let weatherData: WeatherData;

    if (requestedDate) {
      const daily = data.daily;
      const temperature = (daily.temperature_2m_max[0] + daily.temperature_2m_min[0]) / 2;
      const condition = codeToCondition(daily.weather_code[0]);

      weatherData = {
        temperature: temperature,
        precipitation: daily.precipitation_sum[0],
        humidity: 50, // Not available in daily historical data
        windSpeed: daily.wind_speed_10m_max[0],
        pressure: 1012, // Not available in daily historical data
        visibility: 10, // Not available
        uvIndex: daily.uv_index_max[0],
        condition: condition
      };
    } else {
      const current = data.current;
      const daily = data.daily;
      const temperature = current.temperature_2m;
      const humidity = current.relative_humidity_2m;
      const weatherCode = current.weather_code;
      let visibility = 10;
      if (weatherCode >= 45 && weatherCode <= 48) visibility = 2; // fog
      else if (weatherCode >= 51 && weatherCode <= 67) visibility = 5; // rain
      else if (weatherCode >= 71 && weatherCode <= 77) visibility = 3; // snow
      else if (weatherCode >= 80 && weatherCode <= 99) visibility = 4; // showers/thunderstorms
      else if (humidity > 85) visibility = 7;


      let condition = codeToCondition(weatherCode);
      // Only override to 'partly cloudy' if it's currently 'sunny' or 'very sunny', humidity is high, and not rainy/cloudy
      if ((condition === 'sunny' || condition === 'very sunny') && humidity > 70) {
        condition = 'partly cloudy';
      }
      if (condition === 'sunny' && daily.uv_index_max[0] > 8 && temperature > 25) {
        condition = 'very sunny';
      }

      weatherData = {
        temperature: temperature,
        precipitation: current.precipitation || 0,
        humidity: humidity,
        windSpeed: current.wind_speed_10m,
        pressure: current.surface_pressure,
        visibility: visibility,
        uvIndex: daily.uv_index_max[0] || 5,
        condition: condition
      };
    }

    console.log('Processed weather data:', weatherData);

    return new Response(
      JSON.stringify(weatherData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-weather function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        // Fallback data
        temperature: 20,
        precipitation: 0,
        humidity: 60,
        windSpeed: 5,
        pressure: 1013,
        visibility: 10,
        uvIndex: 5,
        condition: 'sunny'
      }),
      {
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});