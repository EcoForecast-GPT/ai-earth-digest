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

  // GLDAS dataset provides key weather variables.
  const dataset = 'GLDAS_NOAH025_3H_V2.1'; 
  const variables = 'Tair_f_inst,Rainf_f_tavg'; // Air Temperature, Rainfall rate

  const url = `https://hydro1.gesdisc.eosdis.nasa.gov/daac-bin/access/timeseries.cgi?variable=${dataset}:${variables}&location=GEOM:POINT(${lon},%20${lat})&startDate=${startDate}T00&endDate=${endDate}T23&type=json`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${EARTHDATA_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`NASA Data Rods API Error: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    
    // The data is returned in a specific format that needs parsing.
    // It's an array of arrays, where each inner array corresponds to a variable.
    const temperatureData = rawData.data[0];
    const precipitationData = rawData.data[1];

    const parsedData = temperatureData.map((entry: any, index: number) => {
      const timestamp = entry[0];
      const temperatureKelvin = entry[1];
      const precipitationRate = precipitationData[index][1];

      // Convert temperature from Kelvin to Celsius
      const temperatureCelsius = temperatureKelvin - 273.15;
      
      // Convert precipitation rate (kg/m^2/s) to mm/hr
      // 1 kg/m^2/s = 3600 mm/hr
      const precipitationMmHr = precipitationRate * 3600;

      return {
        time: new Date(timestamp).toISOString(),
        temperature: temperatureCelsius,
        precipitation: precipitationMmHr,
      };
    });

    return parsedData;

  } catch (error) {
    console.error("Failed to fetch or parse time-series data from NASA Data Rods:", error);
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
