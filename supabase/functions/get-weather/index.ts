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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();
    
    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Missing lat or lon parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}`);

    // Get date parameter from request, defaulting to current date
    const { date } = await req.json();
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Use Open-Meteo historical weather API for past dates, forecast for future
    const isPastDate = new Date(targetDate) < new Date();
    const baseUrl = isPastDate 
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast';
      
    const openMeteoUrl = isPastDate
      ? `${baseUrl}?latitude=${lat}&longitude=${lon}&start_date=${targetDate}&end_date=${targetDate}&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=uv_index_max&timezone=auto`
      : `${baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=uv_index_max&timezone=auto`;
    
    console.log(`Fetching weather from: ${openMeteoUrl}`);
    const response = await fetch(openMeteoUrl);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    console.log('Open-Meteo response:', JSON.stringify(data));

    // Extract weather data based on response type (historical vs current)
    let temperature, humidity, precipitation, windSpeed, pressure, uvIndex, weatherCode;
    
    if (isPastDate && data.hourly) {
      // For historical data, use the specified hour or default to noon
      const hour = (new Date(targetDate).getHours() || 12) % 24;
      const idx = hour;
      
      temperature = data.hourly.temperature_2m[idx];
      humidity = data.hourly.relative_humidity_2m[idx];
      precipitation = data.hourly.precipitation[idx] || 0;
      windSpeed = data.hourly.wind_speed_10m[idx];
      pressure = data.hourly.surface_pressure[idx];
      uvIndex = daily.uv_index_max[0] || 5;
      weatherCode = data.hourly.weather_code[idx];
      
      console.log(`Using historical data for hour ${hour}:`, {
        temperature,
        humidity,
        precipitation,
        windSpeed,
        pressure,
        uvIndex,
        weatherCode
      });
    } else {
      // Current weather data
      temperature = current.temperature_2m;
      humidity = current.relative_humidity_2m;
      precipitation = current.precipitation || 0;
      windSpeed = current.wind_speed_10m;
      pressure = current.surface_pressure;
      uvIndex = daily.uv_index_max[0] || 5;
      weatherCode = current.weather_code;
    }

    // Calculate visibility based on weather conditions
    let visibility = 10;
    if (weatherCode >= 45 && weatherCode <= 48) visibility = 2; // fog
    else if (weatherCode >= 51 && weatherCode <= 67) visibility = 5; // rain
    else if (weatherCode >= 71 && weatherCode <= 77) visibility = 3; // snow
    else if (weatherCode >= 80 && weatherCode <= 99) visibility = 4; // showers/thunderstorms
    else if (humidity > 85) visibility = 7;

    // Determine condition based on weather code and metrics
    let condition: WeatherData['condition'] = 'sunny';
    
    // WMO Weather interpretation codes
    if (weatherCode >= 95 && weatherCode <= 99) {
      condition = 'stormy'; // Thunderstorm
    } else if (weatherCode >= 80 && weatherCode <= 82) {
      condition = 'rainy'; // Rain showers
    } else if (weatherCode >= 61 && weatherCode <= 67) {
      condition = 'rainy'; // Rain
    } else if (weatherCode >= 51 && weatherCode <= 57) {
      condition = 'rainy'; // Drizzle
    } else if (weatherCode >= 3) {
      condition = 'very cloudy'; // Overcast
    } else if (weatherCode === 2) {
      condition = 'cloudy'; // Partly cloudy
    } else if (weatherCode === 1) {
      condition = 'partly cloudy'; // Mainly clear
    } else if (weatherCode === 0) {
      // Clear sky - determine if very sunny based on UV and temp
      if (uvIndex > 8 && temperature > 25) {
        condition = 'very sunny';
      } else {
        condition = 'sunny';
      }
    }

    // Additional refinement based on humidity
    if (condition === 'sunny' || condition === 'very sunny') {
      if (humidity > 70) condition = 'partly cloudy';
    }

    const weatherData: WeatherData = {
      temperature,
      precipitation,
      humidity,
      windSpeed,
      pressure,
      visibility,
      uvIndex,
      condition
    };

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
