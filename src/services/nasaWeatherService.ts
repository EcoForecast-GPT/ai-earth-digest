// NASA GES DISC API Service for weather data
const NASA_GES_DISC_BASE_URL = "https://hydro1.gesdisc.eosdis.nasa.gov/daac-bin/access/timeseries.cgi";

export interface NASAWeatherData {
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number; // This is not available in the new API, will use a fallback
  condition: 'very sunny' | 'sunny' | 'partly cloudy' | 'cloudy' | 'very cloudy' | 'rainy' | 'stormy';
}

export const fetchNASAWeatherData = async (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  apiKey: string
): Promise<NASAWeatherData> => {
  try {
    const variables = [
      "NLDAS_NOAH0125_H.002:tmp2m",      // 2-meter air temperature in Kelvin
      "NLDAS_NOAH0125_H.002:apcpsfc",   // Accumulated precipitation (surface) in kg/m^2
      "NLDAS_NOAH0125_H.002:spfh2m",    // 2-meter specific humidity in kg/kg
      "NLDAS_NOAH0125_H.002:wind10m",   // 10-meter wind speed in m/s
      "NLDAS_NOAH0125_H.002:pressfc"    // Surface pressure in Pa
    ];

    const requests = variables.map(variable => {
      const params = new URLSearchParams({
        variable,
        location: `POINT(${lon} ${lat})`,
        startDate: `${startDate}T00:00:00Z`,
        endDate: `${endDate}T23:59:59Z`,
        type: 'asc2',
      });
      return fetch(`${NASA_GES_DISC_BASE_URL}?${params}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
    });

    const responses = await Promise.all(requests);

    const data = await Promise.all(responses.map(async (response) => {
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`NASA API error: ${response.status} - ${errorBody}`);
      }
      return response.text();
    }));

    const parsedData: { [key: string]: number } = {};

    data.forEach((text, index) => {
      const lines = text.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const values = lastLine.trim().split(/\s+/);
      const value = parseFloat(values[values.length - 1]);
      const variableName = variables[index].split(':')[1];
      parsedData[variableName] = value;
    });

    // Convert temperature from Kelvin to Celsius
    const temperature = parsedData.tmp2m - 273.15;
    const precipitation = parsedData.apcpsfc;
    const humidity = parsedData.spfh2m * 100; // Convert specific humidity to percentage (approximation)
    const windSpeed = parsedData.wind10m;
    const pressure = parsedData.pressfc / 100; // Convert Pa to hPa

    // Determine weather condition based on data
    let condition: NASAWeatherData['condition'] = 'sunny';
    if (precipitation > 0.5) {
      condition = precipitation > 2.5 ? 'stormy' : 'rainy';
    } else if (humidity > 85) {
      condition = 'very cloudy';
    } else if (humidity > 70) {
      condition = 'cloudy';
    } else if (humidity > 50) {
      condition = 'partly cloudy';
    }

    return {
      temperature,
      precipitation,
      humidity,
      windSpeed,
      pressure,
      visibility: 10 - (humidity / 10), // Estimate visibility
      uvIndex: 5, // Fallback value as UV index is not available
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
      pressure: 1013,
      visibility: 10,
      uvIndex: 5,
      condition: 'sunny'
    };
  }
};