// NASA POWER API Service for weather data
const NASA_API_BASE_URL = "/api/nasa-proxy";

export interface NASAWeatherData {
  temperature: number; // Celsius
  precipitation: number; // mm/day
  humidity: number; // percentage
  windSpeed: number; // m/s
  pressure: number; // kPa
  condition: 'very sunny' | 'sunny' | 'partly cloudy' | 'cloudy' | 'very cloudy' | 'rainy' | 'stormy';
}

interface NasaPowerResponse {
  properties: {
    parameter: {
      T2M: { [key: string]: number };       // Temperature
      PRECTOT: { [key: string]: number };   // Precipitation
      RH2M: { [key: string]: number };      // Humidity
      WS2M: { [key: string]: number };      // Wind Speed
      PS: { [key: string]: number };        // Pressure
    };
  };
}

export const fetchNASAWeatherData = async (
  lat: number,
  lon: number,
  date: string,
): Promise<NASAWeatherData> => {
  try {
    // Format date as YYYYMMDD for NASA POWER API
    const formattedDate = date.split('T')[0].replace(/-/g, '');
    const response = await fetch(
      `${NASA_API_BASE_URL}?lat=${lat}&lon=${lon}&start=${formattedDate}&end=${formattedDate}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data: NasaPowerResponse = await response.json();
    
    // Get the latest timestamp's data
    const timestamps = Object.keys(data.properties.parameter.T2M);
    const latestTimestamp = timestamps[timestamps.length - 1];

    // Extract weather data
    const temperature = data.properties.parameter.T2M[latestTimestamp];      // Already in Celsius
    const precipitation = data.properties.parameter.PRECTOT[latestTimestamp]; // mm/day
    const humidity = data.properties.parameter.RH2M[latestTimestamp];        // %
    const windSpeed = data.properties.parameter.WS2M[latestTimestamp];       // m/s
    const pressure = data.properties.parameter.PS[latestTimestamp];          // kPa

    // Determine weather condition based on precipitation and humidity
    let condition: NASAWeatherData['condition'] = 'sunny';
    if (precipitation > 5) condition = 'stormy';
    else if (precipitation > 0.5) condition = 'rainy';
    else if (humidity > 85) condition = 'very cloudy';
    else if (humidity > 70) condition = 'cloudy';
    else if (humidity > 50) condition = 'partly cloudy';
    else if (humidity <= 30) condition = 'very sunny';

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

export const fetchHistoricalData = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<HistoricalDataPoint[]> => {
  try {
    // Format dates as YYYYMMDD for NASA POWER API
    const formattedStart = startDate.replace(/-/g, '');
    const formattedEnd = endDate.replace(/-/g, '');

    const response = await fetch(
      `${NASA_API_BASE_URL}?lat=${lat}&lon=${lon}&start=${formattedStart}&end=${formattedEnd}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }

    const data: NasaPowerResponse = await response.json();
    // Extract weather data points
    const timestamps = Object.keys(data.properties.parameter.T2M);
    
    return timestamps.map(timestamp => ({
      timestamp,
      temperature: data.properties.parameter.T2M[timestamp],      // Already in Celsius
      precipitation: data.properties.parameter.PRECTOT[timestamp], // mm/day
    })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  } catch (error) {
    console.error('Error fetching NASA historical data:', error);
    throw error;
  }
};