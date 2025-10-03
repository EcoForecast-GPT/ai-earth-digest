// Weather service backed by NASA Earthdata time-series (via proxy). This returns a daily
// summary computed from NASA time-series points for the requested date and location.
import { fetchTimeSeriesData } from '@/services/nasaEarthdataService';

export interface NASAWeatherData {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: 'very sunny' | 'sunny' | 'partly cloudy' | 'cloudy' | 'very cloudy' | 'rainy' | 'stormy';
}

export const fetchNASAWeatherData = async (
  lat: number,
  lon: number,
  date?: string
): Promise<NASAWeatherData> => {
  try {
    const targetDate = date ? new Date(date) : new Date();
    const dStr = targetDate.toISOString().split('T')[0];

    // Fetch time-series for the single day (get hourly/periodic points if available)
    const series = await fetchTimeSeriesData({ lat, lon, startDate: dStr, endDate: dStr });

    if (!Array.isArray(series) || series.length === 0) {
      throw new Error('No NASA data available for requested date');
    }

    // Compute daily aggregates
    const temps: number[] = [];
    const precs: number[] = [];
    const winds: number[] = [];
    const hums: number[] = [];

    series.forEach((p: any) => {
      if (typeof p.temperature === 'number' && !isNaN(p.temperature)) temps.push(p.temperature);
      if (typeof p.precipitation === 'number' && !isNaN(p.precipitation)) precs.push(p.precipitation);
      if (typeof p.windSpeed === 'number' && !isNaN(p.windSpeed)) winds.push(p.windSpeed);
      if (typeof p.humidity === 'number' && !isNaN(p.humidity)) hums.push(p.humidity);
    });

    const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const sum = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) : 0;

    const temperature = Math.round((avg(temps)) * 10) / 10;
    const precipitation = Math.round((sum(precs)) * 10) / 10;
    const humidity = Math.round((avg(hums)));
    const windSpeed = Math.round((avg(winds)) * 10) / 10;

    // Conservative defaults for fields not reliably present in time-series
    const pressure = 1013;
    const visibility = 10;
    const uvIndex = 0;

    // Simple condition derivation from precipitation and humidity
    let condition: NASAWeatherData['condition'] = 'sunny';
    if (precipitation > 20) condition = 'stormy';
    else if (precipitation > 2) condition = 'rainy';
    else if (humidity > 85) condition = 'very cloudy';
    else if (humidity > 70) condition = 'cloudy';

    return {
      temperature,
      precipitation,
      humidity,
      windSpeed,
      pressure,
      visibility,
      uvIndex,
      condition,
    };
  } catch (error) {
    console.error('Error fetching NASA weather data (time-series):', error);
    throw error instanceof Error ? error : new Error('Unknown weather fetch error');
  }
};