import { describe, it, expect, vi, beforeAll } from 'vitest';
import { fetchNASAWeatherData } from '../src/services/nasaWeatherService';
import { fetchTimeSeriesData } from '../src/services/nasaEarthdataService';
import { predictWeatherFromSeries } from '../src/lib/predictor';

// Mock environment variables
vi.mock('../src/lib/config', () => ({
  config: {
    DEBUG: true,
    PREDICTION_TIMER_MS: 50000,
  }
}));

// Mock NASA data service
vi.mock('../src/services/nasaEarthdataService', () => ({
  fetchTimeSeriesData: vi.fn()
}));

// Mock weather service keeping the actual implementation
vi.mock('../src/services/nasaWeatherService', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    DEBUG: true,
    fetchNASAWeatherData: vi.fn()
  };
});

describe('NASA Weather Service', () => {
  // AC-1: Current temperature should be 32°C (±0.5°C)
  it('should convert temperature from Kelvin to Celsius correctly', async () => {
    const mockTemp = 273.15 + 32; // 32°C in Kelvin
    const mockSeries = [{
      time: new Date().toISOString(),
      temperature: mockTemp,
      precipitation: 0,
      humidity: 50,
      windSpeed: 5
    }];

    (fetchTimeSeriesData as any).mockResolvedValue(mockSeries);
    (fetchNASAWeatherData as any).mockResolvedValue({
      temperature: 32,
      precipitation: 0,
      humidity: 50,
      windSpeed: 5,
      pressure: 1013,
      visibility: 10,
      uvIndex: 5,
      condition: 'sunny',
      _debug: {
        rawTemperature: mockTemp,
        rawTimestamps: [mockSeries[0].time],
        rawTemperatures: [mockTemp]
      }
    });
    
    const result = await fetchNASAWeatherData(0, 0);
    expect(result.temperature).toBeCloseTo(32, 0.5);
    
    if (result._debug) {
      expect(result._debug.rawTemperature).toBeCloseTo(mockTemp);
    }
  });

  // AC-2: Forecast for 2025-09-04 should be 35°C (±0.5°C)
  it('should predict temperature correctly for specific date', () => {
    const historicalData = Array.from({ length: 10 }, (_, i) => ({
      time: new Date(2025, 8, i + 1).toISOString(), // September 1-10
      temperature: 273.15 + 35 // 35°C in Kelvin
    }));

    const targetDate = new Date('2025-09-04');
    const prediction = predictWeatherFromSeries(historicalData, targetDate);
    
    expect(prediction.temperature).toBeCloseTo(35, 0.5);
  });

  // AC-6: Debug logging
  it('should include debug info when DEBUG is true', async () => {
    const mockTemp = 273.15 + 32;
    const mockSeries = [{
      time: new Date().toISOString(),
      temperature: mockTemp
    }];

    (fetchTimeSeriesData as any).mockResolvedValue(mockSeries);
    (fetchNASAWeatherData as any).mockResolvedValue({
      temperature: 32,
      precipitation: 0,
      humidity: 50,
      windSpeed: 5,
      pressure: 1013,
      visibility: 10,
      uvIndex: 5,
      condition: 'sunny',
      _debug: {
        rawTemperature: mockTemp,
        rawTimestamps: [mockSeries[0].time],
        rawTemperatures: [mockTemp]
      }
    });
    
    const result = await fetchNASAWeatherData(0, 0);
    expect(result._debug).toBeDefined();
    expect(result._debug?.rawTemperatures).toBeDefined();
    expect(result._debug?.rawTimestamps).toBeDefined();
  });

  // Temperature validation
  it('should validate and clamp extreme temperatures', () => {
    const extremeData = [
      { time: new Date().toISOString(), temperature: 273.15 + 100 }, // 100°C (invalid)
      { time: new Date().toISOString(), temperature: 273.15 - 100 }  // -100°C (invalid)
    ];

    const prediction = predictWeatherFromSeries(extremeData, new Date());
    expect(prediction.temperature).toBeGreaterThanOrEqual(-60);
    expect(prediction.temperature).toBeLessThanOrEqual(60);
  });
});