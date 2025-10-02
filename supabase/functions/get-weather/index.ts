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

    // NASA Data Rods API (GLDAS)
    // Only daily temperature and precipitation are available, so we synthesize the rest or set as null/unknown
    const dateString = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const nasaUrl = `https://hydro1.gesdisc.eosdis.nasa.gov/daac-bin/access/timeseries.cgi?variable=NLDAS_FORA0125_H_002:Tair_f_inst&location=GEOM:POINT(${lon},%20${lat})&startDate=${dateString}T00:00:00&endDate=${dateString}T23:59:59&type=asc2`;
    const response = await fetch(nasaUrl);
    if (!response.ok) {
      throw new Error(`NASA Data Rods API error: ${response.status}`);
    }
    const rawText = await response.text();
    // Parse the returned ASCII data
    const lines = rawText.trim().split('\n');
    const dataLines = lines.filter(line => !line.startsWith('#') && !line.startsWith('Date'));
    if (dataLines.length === 0) {
      throw new Error('No NASA data available for this date/location');
    }
    // Use the first data line for the day
    const tokens = dataLines[0].split(/\s+/);
    const timestamp = tokens[0];
    const tempK = parseFloat(tokens[1]);
    const temperature = isNaN(tempK) ? null : tempK - 273.15;
    // Precipitation is not available in this variable, so set to null
    const weatherData: WeatherData = {
      temperature: temperature ?? 0,
      precipitation: 0, // Not available from NASA Data Rods (GLDAS Tair_f_inst)
      humidity: 0,      // Not available
      windSpeed: 0,     // Not available
      pressure: 0,      // Not available
      visibility: 0,    // Not available
      uvIndex: 0,       // Not available
      condition: 'sunny' // NASA does not provide condition, so default
    };
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