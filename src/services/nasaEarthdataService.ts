/**
 * @file This service is responsible for fetching data from NASA's Earthdata services,
 * such as Data Rods for time-series data and GIBS for map imagery.
 */
import { config } from '@/lib/config';

const NASA_API_KEY = 'XjsdXPro2vh4bNJe9sv2PWNGGSBcv72Z74HDnsJG'; // Public key
const EARTHDATA_TOKEN = 'eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6InNocmVzdGgwOTAxIiwiZXhwIjoxNzY0NTY3MTE4LCJpYXQiOjE3NTkzODMxMTgsImlzcyI6Imh0dHBzOi8vdXJzLmVhcnRoZGF0YS5uYXNhLmdvdiIsImlkZW50aXR5X3Byb3ZpZGVyIjoiZWRsX29wcyIsImFjciI6ImVkbCIsImFzc3VyYW5jZV9sZXZlbCI6M30.1DtnKV8tU2kCNy-hlKImBIurffJl7uOe48H732nHDIV5uZJWeA4NI05o0fb0g9ux5ikc5nNFHaAPq5PFn-NPdEA2ErCzZBPGXmycYqiz3cuv9cGY5JevObzzpoJt5Nr4eVAqCVMDarI1KIWFcvvYs57bQEMTMU9bTbQxOAehN4sT-cQwWNY-vq1Qvfpk67K1wWz6KdN4TQ_1M0ZY4O8kzYTAJir6yrIVj4H_OYCMOLZhMkpyZyv_p961oNtC8WeeE1pPyehzkSF9eZMHCelYs689fCYxnJTjYPPIM9F2lhUNesm5E5_cddinnz1QcoHv6B8eUEJJwvkQehGBVLwrww';

interface TimeSeriesParams {
  lat: number;
  lon: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Fetches time-series weather data from NASA's Data Rods service (using GLDAS dataset).
 * @param params - The latitude, longitude, and date range.
 * @returns A promise that resolves to the parsed time-series data.
 */
export const fetchTimeSeriesData = async (params: TimeSeriesParams) => {
  const { lat, lon, startDate, endDate } = params;

  // Use the Supabase Edge Function as a proxy. Support both VITE_ and NEXT_PUBLIC_ prefixes.
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key not found in environment. Expected VITE_* or NEXT_PUBLIC_* env vars.');
  }

  const proxyUrl = new URL(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/proxy-nasa-data`);
  proxyUrl.searchParams.append('lat', lat.toString());
  proxyUrl.searchParams.append('lon', lon.toString());
  proxyUrl.searchParams.append('startDate', startDate);
  proxyUrl.searchParams.append('endDate', endDate);

  try {
    const response = await fetch(proxyUrl.toString(), {
      headers: {
        // Supabase Functions accept either an Authorization Bearer token or an 'apikey' header.
        // Provide both to be robust against different Supabase setups.
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      }
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const errorBody = contentType.includes('application/json') ? await response.json() : await response.text();
      // Throw a detailed error so the UI shows exact proxy response (helps debug 401 Invalid JWT).
      throw new Error(`Proxy service error: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      try {
        // Expose the last proxy response for runtime debugging (only in browser)
        if (typeof window !== 'undefined') (window as any).__LAST_PROXY_RESPONSE = body;
      } catch (e) {
        // ignore
      }
      if (config.DEBUG) {
        console.debug('NASA POWER API response:', body);
      }
      
      if (body.properties?.parameter) {
        const params = body.properties.parameter;
        if (!params.T2M || !params.PRECTOT || !params.RH2M || !params.WS2M) {
          throw new Error('Missing required parameters in NASA POWER API response');
        }
        
        const timestamps = Object.keys(params.T2M);
        if (timestamps.length === 0) {
          throw new Error('No data points found in NASA POWER API response');
        }
        
        const parsed = timestamps.map(timestamp => {
          // T2M is in Celsius, no conversion needed
          const temp = params.T2M[timestamp];
          if (temp === -999 || temp < -50 || temp > 60) return null;
          
          // PRECTOT is in mm/hour
          const precip = params.PRECTOT[timestamp];
          if (precip === -999 || precip < 0) return null;
          
          // RH2M is relative humidity (%)
          const humidity = params.RH2M[timestamp];
          if (humidity === -999 || humidity < 0 || humidity > 100) return null;
          
          // WS2M is wind speed at 2 meters (m/s)
          const windSpeed = params.WS2M[timestamp];
          if (windSpeed === -999 || windSpeed < 0) return null;
          
          const isoTime = new Date(`${timestamp.split(':')[0]}Z`).toISOString();
          
          return {
            time: isoTime,
            temperature: Math.round(temp * 10) / 10,
            precipitation: Math.round(precip * 10) / 10,
            windSpeed: Math.round(windSpeed * 10) / 10,
            humidity: Math.round(humidity)
          };
        }).filter(point => point !== null);

        // Sort by time
        parsed.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        
        // Sort by time
        parsed.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        
        return parsed;
      }
      throw new Error('Invalid or empty NASA POWER data response');
    }

    const rawText = await response.text();

    // The data is returned as a multi-line string that needs parsing.
    // Skip header lines and parse data lines.
    const lines = rawText.trim().split('\n')
      .filter(line => !line.startsWith('#') && !line.startsWith('Date'));

    const parsedData = lines
      .map(line => {
        const tokens = line.split(/\s+/);
        const timestamp = tokens[0];
        const tempStr = tokens[1];
        const precipStr = tokens[2];
        const windStr = tokens[3];
        const humidityStr = tokens[4];

        const temperatureKelvin = parseFloat(tempStr);
        const temperatureCelsius = isNaN(temperatureKelvin) ? NaN : (temperatureKelvin - 273.15);

        // Only include points with valid temperature
        if (isNaN(temperatureCelsius) || temperatureCelsius < -50 || temperatureCelsius > 60) {
          return null;
        }

        // Clean precipitation data
        let precipitation = 0;
        if (precipStr !== undefined) {
          const p = parseFloat(precipStr);
          if (!isNaN(p) && p >= 0) {
            precipitation = p;
          }
        }

        // Parse wind speed if available
        let windSpeed;
        if (windStr !== undefined) {
          const wind = parseFloat(windStr);
          if (!isNaN(wind) && wind >= 0) {
            windSpeed = wind;
          }
        }

        // Parse humidity if available
        let humidity;
        if (humidityStr !== undefined) {
          const hum = parseFloat(humidityStr);
          if (!isNaN(hum) && hum >= 0 && hum <= 100) {
            humidity = hum;
          }
        }

        return {
          time: new Date(timestamp).toISOString(),
          temperature: Math.round(temperatureCelsius * 10) / 10,
          precipitation: Math.round(precipitation * 10) / 10,
          windSpeed: windSpeed !== undefined ? Math.round(windSpeed * 10) / 10 : undefined,
          humidity: humidity !== undefined ? Math.round(humidity) : undefined,
        };
      })
      .filter(point => point !== null) // Remove invalid points
      .sort((a, b) => new Date(a!.time).getTime() - new Date(b!.time).getTime()); // Sort by time

    if (parsedData.length === 0) {
      throw new Error('No valid NASA weather data found in the response');
    }

    return parsedData;

  } catch (error) {
    console.error("Failed to fetch or parse time-series data via proxy:", error);
    throw error;
  }
};

/**
 * Returns the URL for a NASA GIBS map layer.
 * @param layerName - The name of the GIBS layer (e.g., 'MODIS_Terra_CorrectedReflectance_TrueColor').
 * @param date - The date for the imagery in YYYY-MM-DD format.
 * @returns The tile layer URL template.
 */
export const getGibsTileUrl = (layerName: string, date: string) => {
  const templateUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerName}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`;
  return templateUrl;
};
