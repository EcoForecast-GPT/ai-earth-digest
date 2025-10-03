import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface Request {
  method: string;
  url: string;
  headers: Headers;
  json(): Promise<any>;
}

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

serve(async (req: Request) => {
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

    // Default to today's date if not provided
    const currentDate = new Date().toISOString().split('T')[0];

    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}, date: ${date}`);

    let openMeteoUrl;
    const requestedDate = date ? new Date(date) : null;
    const now = new Date();
    now.setHours(0,0,0,0);

    if (requestedDate) {
      requestedDate.setHours(0,0,0,0);
      const dateString = requestedDate.toISOString().split('T')[0] || currentDate;
      // For all date types (past, today, future) prefer NASA time-series via proxy
      // Build proxy URL to fetch time-series for the day
      // When calling between Edge Functions in production, use the Supabase URL
      const supabaseUrl = new URL(req.url).origin;
      const proxyUrl = `${supabaseUrl}/functions/v1/proxy-nasa-data?lat=${lat}&lon=${lon}&startDate=${dateString}&endDate=${dateString}`;
      
      // Create headers with apikey
      const apikey = req.headers.get('apikey') || '';
      const headers = new Headers({
        'Authorization': `Bearer ${apikey}`,
        'apikey': apikey,
        'Accept': 'application/json'
      });
      
      console.log('Original request headers:', {
        authorization: req.headers.get('Authorization'),
        apikey: req.headers.get('apikey')
      });

      // Make sure we pass through the apikey exactly as received
      console.log('Making proxy request:', {
        url: proxyUrl,
        headers: {
          authorization: apikey ? `Bearer ${apikey}` : '',
          apikey: apikey,
        }
      });
      
      // Make the request with authorization headers
      const proxyResp = await fetch(proxyUrl, { 
        headers: {
          'Authorization': apikey ? `Bearer ${apikey}` : '',
          'apikey': apikey,
          'Accept': 'application/json'
        }
      });
      
      console.log('Proxy response:', {
        status: proxyResp.status,
        statusText: proxyResp.statusText,
        headers: Object.fromEntries(proxyResp.headers.entries())
      });
      if (!proxyResp.ok) {
        const errText = await proxyResp.text();
        console.error('Proxy error details:', errText);
        throw new Error(`NASA proxy error: ${proxyResp.status} - ${errText}`);
      }

      // If proxy returned JSON (fallback), parse series; otherwise parse plain text
      let series: any[] = [];
      const ct = proxyResp.headers.get('content-type') || '';
      const body = await proxyResp.json();
      if (body.properties && body.properties.parameter) {
        // Convert hourly data to series
        const hours = Object.keys(body.properties.parameter.T2M);
        series = hours.map(hour => {
          const date = new Date(
            parseInt(hour.substring(0, 4)),
            parseInt(hour.substring(4, 6)) - 1,
            parseInt(hour.substring(6, 8)),
            parseInt(hour.substring(8, 10))
          );
          return {
            time: date.toISOString(),
            temperature: body.properties.parameter.T2M[hour],
            precipitation: body.properties.parameter.PRECTOTCORR?.[hour] ?? 0,
            windSpeed: body.properties.parameter.WS2M[hour],
            humidity: body.properties.parameter.RH2M[hour]
          };
        });
      }

      // Compute daily aggregates
      const temps = series.filter(s => typeof s.temperature === 'number' && !isNaN(s.temperature)).map(s => s.temperature);
      const precs = series.filter(s => typeof s.precipitation === 'number').map(s => s.precipitation);
      const winds = series.filter(s => typeof s.windSpeed === 'number').map(s => s.windSpeed);
      const hums = series.filter(s => typeof s.humidity === 'number').map(s => s.humidity);

      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const sum = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) : 0;

      const temperature = Math.round(avg(temps) * 10) / 10;
      const precipitation = Math.round(sum(precs) * 10) / 10;
      const humidity = Math.round(avg(hums));
      const windSpeed = Math.round(avg(winds) * 10) / 10;

      const condition = precipitation > 2 ? 'rainy' : (humidity > 70 ? 'cloudy' : 'sunny');

      const weatherData: WeatherData = {
        temperature,
        precipitation,
        humidity,
        windSpeed,
        pressure: 1013,
        visibility: 10,
        uvIndex: 0,
        condition: condition as WeatherData['condition']
      };

      return new Response(JSON.stringify(weatherData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      // Current weather: use NASA time-series via proxy for today's aggregates (no Open-Meteo)
      const todayStr = now.toISOString().split('T')[0];
      const proxyUrlToday = `https://${new URL(req.url).host}/functions/v1/proxy-nasa-data?lat=${lat}&lon=${lon}&startDate=${todayStr}&endDate=${todayStr}`;
      const proxyRespToday = await fetch(proxyUrlToday);
      if (!proxyRespToday.ok) throw new Error(`NASA proxy error: ${proxyRespToday.status}`);

      let seriesToday: any[] = [];
      const ctToday = proxyRespToday.headers.get('content-type') || '';
      if (ctToday.includes('application/json')) {
        const body = await proxyRespToday.json();
        if (Array.isArray(body.series)) seriesToday = body.series.map((s: any) => ({
          time: s.timestamp || s.time,
          temperature: s.tempK ? s.tempK - 273.15 : s.temperature,
          precipitation: s.precipMm ?? s.precipitation ?? 0,
          windSpeed: s.windSpeed,
          humidity: s.humidity,
        }));
      } else {
        const raw = await proxyRespToday.text();
        const lines = raw.trim().split('\n').filter(l => !l.startsWith('#') && !l.toLowerCase().startsWith('date'));
        for (const line of lines) {
          const tokens = line.split(/\s+/);
          const timestamp = tokens[0];
          const tempK = parseFloat(tokens[1]);
          const precip = parseFloat(tokens[2] || '0');
          seriesToday.push({ time: new Date(timestamp).toISOString(), temperature: (isNaN(tempK) ? NaN : tempK - 273.15), precipitation: isNaN(precip) ? 0 : precip });
        }
      }

      const temps = seriesToday.filter(s => typeof s.temperature === 'number' && !isNaN(s.temperature)).map(s => s.temperature);
      const precs = seriesToday.filter(s => typeof s.precipitation === 'number').map(s => s.precipitation);
      const winds = seriesToday.filter(s => typeof s.windSpeed === 'number').map(s => s.windSpeed);
      const hums = seriesToday.filter(s => typeof s.humidity === 'number').map(s => s.humidity);

      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const sum = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) : 0;

      const temperature = Math.round(avg(temps) * 10) / 10;
      const precipitation = Math.round(sum(precs) * 10) / 10;
      const humidity = Math.round(avg(hums));
      const windSpeed = Math.round(avg(winds) * 10) / 10;

      const condition = precipitation > 2 ? 'rainy' : (humidity > 70 ? 'cloudy' : 'sunny');

      const weatherData: WeatherData = {
        temperature,
        precipitation,
        humidity,
        windSpeed,
        pressure: 1013,
        visibility: 10,
        uvIndex: 0,
        condition: condition as WeatherData['condition']
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
    }

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