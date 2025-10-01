import { decode } from 'netcdfjs';

interface ProcessedData {
  times: string[];
  values: number[];
}

export async function processNetCDFData(data: ArrayBuffer, variableName: string): Promise<ProcessedData> {
  const reader = new decode(data);
  
  // Get the variable data
  const variable = reader.getDataVariable(variableName);
  if (!variable) {
    throw new Error(`Variable ${variableName} not found in NetCDF data`);
  }

  // Get time dimension
  const time = reader.getDataVariable('time');
  const baseDate = new Date('1980-01-01T00:00:00Z');
  
  // Process the values
  const values = variable.data.map((value: number) => {
    switch(variableName) {
      case 'T2M':
        return value - 273.15; // Kelvin to Celsius
      case 'PRECTOTCORR':
        return value * 3600; // kg/m^2/s to mm/hr
      case 'PS':
        return value / 100; // Pa to hPa
      default:
        return value;
    }
  });

  // Generate timestamps
  const times = time.data.map((hours: number) => {
    const date = new Date(baseDate);
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  });

  return {
    times,
    values
  };
}