// NASA GES DISC API Service for weather data using MERRA-2
const NASA_GES_DISC_BASE_URL = "/api/nasa-proxy";

// --- CURRENT WEATHER DATA ---

export interface NASAWeatherData {
  temperature: number; // Celsius
  precipitation: number; // kg/m^2/hr
  humidity: number; // percentage
  windSpeed: number; // m/s
  pressure: number; // hPa
  condition: 'very sunny' | 'sunny' | 'partly cloudy' | 'cloudy' | 'very cloudy' | 'rainy' | 'stormy';
}

export const fetchNASAWeatherData = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<NASAWeatherData> => {
  try {
    const variables = [
      "T2M", "PRECTOTCORR", "QV2M", "U10M", "V10M", "PS"
    ];

    const NASA_API_KEY = 'XjsdXPro2vh4bNJe9sv2PWNGGSBcv72Z74HDnsJG';
    const requests = variables.map(variable => {
      const params = new URLSearchParams({
        variable,
        location: `GEOM:POINT(${lon}, ${lat})`,
        startDate: `${startDate}T00:00:00Z`,
        endDate: `${endDate}T23:59:59Z`,
        type: 'asc2',
        api_key: NASA_API_KEY,
      });
      return fetch(`${NASA_GES_DISC_BASE_URL}?${params}`);
    });

    const responses = await Promise.all(requests);
    const data = await Promise.all(responses.map(async (response, index) => {
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to fetch data for ${variables[index]}: ${errorBody}`);
      }
      return response.text();
    }));

    const parsedData: { [key: string]: number } = {};
    data.forEach((text, index) => {
      const lines = text.trim().split('\n');
      if (lines.length < 2) throw new Error(`No data for ${variables[index]}`);
      const lastLine = lines[lines.length - 1];
      const values = lastLine.trim().split(/\s+/);
      parsedData[variables[index]] = parseFloat(values[values.length - 1]);
    });

    const temperature = parsedData.T2M - 273.15;
    const precipitation = parsedData.PRECTOTCORR * 3600;
    const saturationVaporPressure = 6.112 * Math.exp((17.67 * temperature) / (temperature + 243.5));
    const vaporPressure = (parsedData.PS / 100 * parsedData.QV2M) / (0.622 + (1 - 0.622) * parsedData.QV2M);
    const humidity = Math.min(100, (vaporPressure / saturationVaporPressure) * 100);
    const windSpeed = Math.sqrt(parsedData.U10M ** 2 + parsedData.V10M ** 2);
    const pressure = parsedData.PS / 100;

    let condition: NASAWeatherData['condition'] = 'sunny';
    if (precipitation > 0.1) condition = precipitation > 2.5 ? 'stormy' : 'rainy';
    else if (humidity > 85) condition = 'very cloudy';
    else if (humidity > 70) condition = 'cloudy';
    else if (humidity > 50) condition = 'partly cloudy';

    return { temperature, precipitation, humidity, windSpeed, pressure, condition };

  } catch (error) {
    console.error('Error processing NASA weather data:', error);
    throw error;
  }
};

// --- HISTORICAL TIME SERIES DATA ---

export interface HistoricalDataPoint {
  timestamp: string;
  temperature: number | null;
  precipitation: number | null;
}

const parseTimeSeries = (text: string, variableName: 'temperature' | 'precipitation') => {
  const data: { [timestamp: string]: Partial<HistoricalDataPoint> } = {};
  const lines = text.trim().split('\n');
  // Skip header lines that don't start with a date
  const dataLines = lines.filter(line => line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/));
  
  dataLines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const timestamp = parts[0];
    let value: number | null = parseFloat(parts[1]);

    if (isNaN(value) || value < -999) { // MERRA-2 uses -9999 for fill values
      value = null;
    } else {
      if (variableName === 'temperature') {
        value -= 273.15; // Kelvin to Celsius
      } else if (variableName === 'precipitation') {
        value *= 3600; // kg/m^2/s to kg/m^2/hr (mm/hr)
      }
    }

    if (!data[timestamp]) data[timestamp] = { timestamp };
    data[timestamp][variableName] = value;
  });

  return data;
};

export const fetchNASAHistoricalData = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<HistoricalDataPoint[]> => {
  try {
    const variables = {
      temperature: "T2M",
      precipitation: "PRECTOTCORR"
    };

    const NASA_API_KEY = 'XjsdXPro2vh4bNJe9sv2PWNGGSBcv72Z74HDnsJG';
    const requests = Object.values(variables).map(variable => {
      const params = new URLSearchParams({
        variable,
        location: `GEOM:POINT(${lon}, ${lat})`,
        startDate: `${startDate}T00:00:00Z`,
        endDate: `${endDate}T23:59:59Z`,
        type: 'asc2',
        api_key: NASA_API_KEY,
      });
      return fetch(`${NASA_GES_DISC_BASE_URL}?${params}`);
    });

    const responses = await Promise.all(requests);
    const [tempText, precipText] = await Promise.all(responses.map(res => res.text()));

    if (!responses[0].ok) throw new Error(`Failed to fetch temperature data: ${tempText}`);
    if (!responses[1].ok) throw new Error(`Failed to fetch precipitation data: ${precipText}`);

    const tempData = parseTimeSeries(tempText, 'temperature');
    const precipData = parseTimeSeries(precipText, 'precipitation');

    // Merge data based on timestamp
    const merged: { [timestamp: string]: HistoricalDataPoint } = {};
    Object.values(tempData).forEach(d => { if(d.timestamp) merged[d.timestamp] = { ...merged[d.timestamp], ...d }; });
    Object.values(precipData).forEach(d => { if(d.timestamp) merged[d.timestamp] = { ...merged[d.timestamp], ...d }; });

    return Object.values(merged).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  } catch (error) {
    console.error('Error fetching NASA historical data:', error);
    throw error;
  }
};