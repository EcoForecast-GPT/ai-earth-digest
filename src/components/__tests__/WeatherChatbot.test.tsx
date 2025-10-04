import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WeatherChatbot } from '../WeatherChatbot';

// Mock env vars for NASA API
beforeAll(() => {
  process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
});

// Mock fetchTimeSeriesData to return synthetic data instantly
vi.mock('@/services/nasaEarthdataService', () => ({
  fetchTimeSeriesData: vi.fn(async () => {
    // 10 years of daily data, simple pattern
    const arr = [];
    for (let y = 2015; y <= 2025; ++y) {
      for (let m = 0; m < 12; ++m) {
        for (let d = 1; d <= 28; ++d) {
          arr.push({
            time: `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
            temperature: 25 + Math.sin((m/12)*Math.PI*2)*10,
            precipitation: m === 0 ? 0 : 2,
            humidity: 60 + m,
            windSpeed: 5 + m/2,
          });
        }
      }
    }
    return arr;
  })
}));

describe('WeatherChatbot', () => {
  it('renders initial greeting', () => {
    render(<WeatherChatbot />);
    expect(screen.getByText(/hello! i'm your weather assistant/i)).toBeTruthy();
  });

  it('responds to a future prediction query', async () => {
    render(<WeatherChatbot location="Dubai, UAE" selectedDate="2026-07-01" />);
    const input = screen.getByPlaceholderText(/ask about weather/i);
    fireEvent.change(input, { target: { value: 'predict weather for 2026-07-01' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    await waitFor(() => {
      expect(screen.getByText(/future prediction/i)).toBeTruthy();
    }, { timeout: 10000 });
  });

  it('responds to a past trend query', async () => {
    render(<WeatherChatbot location="Dubai, UAE" selectedDate="2024-07-01" />);
    const input = screen.getByPlaceholderText(/ask about weather/i);
    fireEvent.change(input, { target: { value: 'show weather trend for 2024-07-01' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    await waitFor(() => {
      expect(screen.getByText(/historical data/i)).toBeTruthy();
    }, { timeout: 10000 });
  });
});
