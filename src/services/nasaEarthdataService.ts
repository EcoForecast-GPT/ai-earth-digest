/**
 * @file This service is responsible for fetching data from NASA's Earthdata services,
 * such as Data Rods for time-series data and GIBS for map imagery.
 */

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

  // Use the Supabase Edge Function as a proxy
  const proxyUrl = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-nasa-data`);
  proxyUrl.searchParams.append('lat', lat.toString());
  proxyUrl.searchParams.append('lon', lon.toString());
  proxyUrl.searchParams.append('startDate', startDate);
  proxyUrl.searchParams.append('endDate', endDate);

  try {
    const response = await fetch(proxyUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Proxy service error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const rawText = await response.text();
    
    // The data is returned as a multi-line string that needs parsing.
    // Skip header lines and parse data lines.
    const lines = rawText.trim().split('\n');
    const dataLines = lines.filter(line => !line.startsWith('#') && !line.startsWith('Date'));

    const parsedData = dataLines.map(line => {
      const [timestamp, tempStr] = line.split(/\s+/);
      const temperatureKelvin = parseFloat(tempStr);
      const temperatureCelsius = temperatureKelvin - 273.15;

      return {
        time: new Date(timestamp).toISOString(),
        temperature: temperatureCelsius,
        // Precipitation is not included in this simplified proxy for now
        precipitation: 0, 
      };
    });

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
