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
    
    // Use NASA POWER API for all weather data
    const nasaPowerUrl = 'https://power.larc.nasa.gov/api/temporal/hourly/point';
    const params = {
      parameters: 'T2M,PRECTOT,RH2M,WS2M,PS,ALLSKY_SFC_SW_DWN',
      community: 'RE',
      longitude: lon,
      latitude: lat,
      start: targetDate,
      end: targetDate,
      format: 'JSON'
    };

    const nasaUrl = `${nasaPowerUrl}?${new URLSearchParams(params)}`;
    console.log(`Fetching NASA POWER data from: ${nasaUrl}`);
    
    const response = await fetch(nasaUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    console.log('Open-Meteo response:', JSON.stringify(data));

    // Extract weather data from NASA POWER response
    const nasaData = data.properties;
    const targetHour = new Date(targetDate).getHours();
    
    // Get data for the specific hour
    const temperature = nasaData.parameter.T2M[targetHour] - 273.15; // Convert K to C
    const humidity = nasaData.parameter.RH2M[targetHour];
    const precipitation = nasaData.parameter.PRECTOT[targetHour];
    const windSpeed = nasaData.parameter.WS2M[targetHour];
    const pressure = nasaData.parameter.PS[targetHour];
    const solarRadiation = nasaData.parameter.ALLSKY_SFC_SW_DWN[targetHour];
    
    // Calculate UV index from solar radiation
    const uvIndex = Math.min(11, Math.round(solarRadiation / 50));
    
    // Determine weather condition from NASA parameters
    const condition = determineConditionFromNASA({
      temp: temperature,
      humidity,
      precip: precipitation,
      wind: windSpeed,
      solar: solarRadiation
    });

    // Calculate visibility based on NASA parameters
    let visibility = 10;
    if (precipitation > 10) visibility = 4; // Heavy rain
    else if (precipitation > 5) visibility = 6; // Moderate rain
    else if (precipitation > 0) visibility = 8; // Light rain
    else if (humidity > 85) visibility = 7; // High humidity
    else if (solarRadiation < 100) visibility = 5; // Cloudy

    // Helper function to determine weather condition from NASA parameters
    function determineConditionFromNASA(params: {
      temp: number;
      humidity: number;
      precip: number;
      wind: number;
      solar: number;
    }): WeatherData['condition'] {
      const { temp, humidity, precip, wind, solar } = params;
      
      // Storm conditions
      if (wind > 20 && precip > 10) return 'stormy';
      if (precip > 15) return 'stormy';
      
      // Rain conditions
      if (precip > 5) return 'rainy';
      if (precip > 0) return 'partly cloudy';
      
      // Cloud conditions based on solar radiation and humidity
      if (solar < 100 || humidity > 85) return 'very cloudy';
      if (solar < 300 || humidity > 70) return 'cloudy';
      if (solar < 500) return 'partly cloudy';
      
      // Clear conditions
      if (solar > 800 && temp > 25) return 'very sunny';
      return 'sunny';
    }

    // Get condition from NASA data
    const weatherCondition = determineConditionFromNASA({
      temp: temperature,
      humidity,
      precip: precipitation,
      wind: windSpeed,
      solar: solarRadiation
    });

    const weatherData: WeatherData = {
      temperature,
      precipitation,
      humidity,
      windSpeed,
      pressure,
      visibility,
      uvIndex,
      condition: weatherCondition
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
