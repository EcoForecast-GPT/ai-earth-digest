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
    const { lat, lon, date } = await req.json();
    
    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Missing lat or lon parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}, date: ${date}`);

    const apiKey = "XjsdXPro2vh4bNJe9sv2PWNGGSBcv72Z74HDnsJG";
    const dateString = date.split('T')[0].replace(/-/g, '');

    const nasaPowerUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,WS10M_MAX,ALLSKY_SFC_UVA,RH2M,PS&community=RE&longitude=${lon}&latitude=${lat}&start=${dateString}&end=${dateString}&format=JSON&api_key=${apiKey}`;
    
    const response = await fetch(nasaPowerUrl);
    
    if (!response.ok) {
      throw new Error(`NASA POWER API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('NASA POWER response:', JSON.stringify(data));

    const properties = data.properties.parameter;
    const temperature = (properties.T2M_MAX[dateString] + properties.T2M_MIN[dateString]) / 2;
    const precipitation = properties.PRECTOTCORR[dateString];
    const windSpeed = properties.WS10M_MAX[dateString];
    const uvIndex = properties.ALLSKY_SFC_UVA[dateString];
    const humidity = properties.RH2M[dateString];
    const pressure = properties.PS[dateString];

    let condition: WeatherData['condition'] = 'sunny';
    if (precipitation > 5) {
      condition = 'stormy';
    } else if (precipitation > 0.5) {
      condition = 'rainy';
    } else if (humidity > 80) {
      condition = 'cloudy';
    } else if (uvIndex < 3) {
      condition = 'partly cloudy';
    }

    const weatherData: WeatherData = {
      temperature: temperature,
      precipitation: precipitation,
      humidity: humidity,
      windSpeed: windSpeed,
      pressure: pressure,
      visibility: 10, // Not available from POWER API
      uvIndex: uvIndex,
      condition: condition
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
