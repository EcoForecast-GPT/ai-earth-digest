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
    // NASA POWER API only has historical data with ~3-5 days delay
    // Query the last 7 days to ensure we get valid data
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    const params = new URLSearchParams({
      parameters: 'T2M,PRECTOTCORR,RH2M,WS2M,PS,ALLSKY_SFC_UV_INDEX',
      community: 'RE',
      longitude: lon.toString(),
      latitude: lat.toString(),
      start: formatDate(sevenDaysAgo),
      end: formatDate(today),
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

    // Get all dates and filter out -999 values to find the most recent valid data
    const t2mDates = Object.keys(parameters.T2M || {});
    
    // Find the most recent date with valid data (not -999)
    let validDate = null;
    for (let i = t2mDates.length - 1; i >= 0; i--) {
      const date = t2mDates[i];
      if (parameters.T2M[date] !== -999) {
        validDate = date;
        break;
      }
    }

    if (!validDate) {
      throw new Error('No valid data available from NASA POWER API');
    }

    // Extract values from the most recent valid date
    const temperature = parameters.T2M?.[validDate];
    const precipitation = parameters.PRECTOTCORR?.[validDate];
    const humidity = parameters.RH2M?.[validDate];
    const windSpeed = parameters.WS2M?.[validDate];
    const pressure = parameters.PS?.[validDate];
    const uvIndex = parameters.ALLSKY_SFC_UV_INDEX?.[validDate];

    // Validate all values are not -999
    if (temperature === -999 || precipitation === -999 || humidity === -999 || 
        windSpeed === -999 || pressure === -999 || uvIndex === -999) {
      throw new Error('Received invalid data from NASA POWER API');
    }

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
