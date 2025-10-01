// NASA POWER API Service for weather data
const NASA_API_KEY = "XjsdXPro2vh4bNJe9sv2PWNGGSBcv72Z74HDnsJG";
const NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";

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
  startDate: string,
  endDate: string
): Promise<NASAWeatherData> => {
  try {
    // NASA POWER API parameters for weather/hydrology data
    const params = new URLSearchParams({
      parameters: 'T2M,PRECTOTCORR,RH2M,WS2M,PS,ALLSKY_SFC_UV_INDEX',
      community: 'RE',
      longitude: lon.toString(),
      latitude: lat.toString(),
      start: startDate.replace(/-/g, ''),
      end: endDate.replace(/-/g, ''),
      format: 'JSON'
    });

    const response = await fetch(`${NASA_POWER_BASE_URL}?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data = await response.json();
    const parameters = data.properties.parameter;

    // Get the most recent data point
    const dates = Object.keys(parameters.T2M || {});
    const latestDate = dates[dates.length - 1];

    const temperature = parameters.T2M?.[latestDate] || 20;
    const precipitation = parameters.PRECTOTCORR?.[latestDate] || 0;
    const humidity = parameters.RH2M?.[latestDate] || 60;
    const windSpeed = parameters.WS2M?.[latestDate] || 5;
    const pressure = parameters.PS?.[latestDate] || 101.3;
    const uvIndex = parameters.ALLSKY_SFC_UV_INDEX?.[latestDate] || 5;

    // Determine weather condition based on data
    let condition: NASAWeatherData['condition'] = 'sunny';
    
    if (precipitation > 10) {
      condition = precipitation > 30 ? 'stormy' : 'rainy';
    } else if (humidity > 85) {
      condition = 'very cloudy';
    } else if (humidity > 70) {
      condition = 'cloudy';
    } else if (humidity > 50) {
      condition = 'partly cloudy';
    } else if (uvIndex > 8 && temperature > 25) {
      condition = 'very sunny';
    }

    return {
      temperature,
      precipitation,
      humidity,
      windSpeed,
      pressure,
      visibility: 10 - (humidity / 10), // Estimate visibility
      uvIndex,
      condition
    };
  } catch (error) {
    console.error('Error fetching NASA weather data:', error);
    // Return fallback data
    return {
      temperature: 20,
      precipitation: 0,
      humidity: 60,
      windSpeed: 5,
      pressure: 101.3,
      visibility: 10,
      uvIndex: 5,
      condition: 'sunny'
    };
  }
};
