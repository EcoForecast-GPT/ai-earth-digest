import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fetchNASAWeatherData } from '@/services/nasaWeatherService';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import DataExport from '@/components/DataExport';
import { WeatherLocation, WeatherData as PageWeatherData } from '@/pages/Index';

interface AdvancedOptionsMenuProps {
  location: WeatherLocation;
  onDataFetched?: (data: PageWeatherData) => void;
}

const AdvancedOptionsMenu: React.FC<AdvancedOptionsMenuProps> = ({ location, onDataFetched }) => {
  // Use an ISO local datetime string for the input (YYYY-MM-DDTHH:mm)
  const [selectedDateTime, setSelectedDateTime] = useState<string>(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000; // offset in ms
    const localISO = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISO;
  });

  const [snapshot, setSnapshot] = useState<PageWeatherData | null>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDateTime(e.target.value);
  };

  const fetchWeatherForDate = async () => {
    if (!selectedDateTime) return;
    setLoading(true);

    try {
      // Extract date portion for NASA API (YYYY-MM-DD)
      const datePart = selectedDateTime.split('T')[0];

      const nasaData = await fetchNASAWeatherData(
        location.lat,
        location.lon,
        datePart,
        datePart
      );

      // Build an hourly time series (0-23) similar to other widgets
      const generatedSeries = Array.from({ length: 24 }, (_, hour) => ({
        timestamp: `${datePart}T${hour.toString().padStart(2, '0')}:00:00Z`,
        time: `${hour.toString().padStart(2, '0')}:00`,
        temperature: Math.round((nasaData.temperature + Math.sin(hour / 4) * 5) * 10) / 10,
        precipitation: Math.round((nasaData.precipitation * (Math.random() * 0.5 + 0.5)) * 100) / 100,
        windSpeed: Math.round((nasaData.windSpeed + Math.random() * 3) * 10) / 10,
        humidity: Math.round((nasaData.humidity + Math.random() * 10 - 5) * 10) / 10,
      }));

      setTimeSeries(generatedSeries);

      // Determine snapshot for specific time (nearest hour)
      const selectedHour = parseInt(selectedDateTime.split('T')[1].split(':')[0], 10);
      const snapshotPoint = generatedSeries[selectedHour];

      const pageData: PageWeatherData = {
        timestamp: new Date(`${datePart}T${selectedHour.toString().padStart(2, '0')}:00:00Z`).toISOString(),
        temperature: nasaData.temperature,
        precipitation: nasaData.precipitation,
        humidity: nasaData.humidity,
        windSpeed: nasaData.windSpeed,
        pressure: nasaData.pressure,
        visibility: nasaData.visibility,
        uvIndex: nasaData.uvIndex,
        timeSeries: generatedSeries
      };

      setSnapshot(pageData);

      // Notify parent so the rest of the page can update
      onDataFetched?.(pageData);

    } catch (err) {
      console.error('AdvancedOptionsMenu: failed to fetch NASA data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed bottom-0 left-0 w-full z-40"
    >
      <div className="max-w-7xl mx-auto px-4">
        <Card className="backdrop-blur-md bg-background/70 border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-lg font-semibold">Advanced Options</h3>
                <p className="text-sm text-muted-foreground">Choose date & time for detailed weather and export results.</p>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="datetime" className="sr-only">Date and time</label>
                <input
                  id="datetime"
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={handleDateTimeChange}
                  className="p-2 rounded border bg-card text-card-foreground"
                />
                <button
                  onClick={fetchWeatherForDate}
                  className="px-4 py-2 bg-primary text-white rounded hover:opacity-95"
                  aria-disabled={loading}
                >
                  {loading ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1">
                <h4 className="text-sm font-medium">Selected Location</h4>
                <p className="text-xs text-muted-foreground">{location.name} — {location.lat.toFixed(3)}, {location.lon.toFixed(3)}</p>
              </div>

              <div className="col-span-1">
                <h4 className="text-sm font-medium">Snapshot</h4>
                {snapshot ? (
                  <div className="text-sm">
                    <p>Time: {new Date(snapshot.timestamp).toLocaleString()}</p>
                    <p>Temp: {snapshot.temperature} °C</p>
                    <p>Precipitation: {snapshot.precipitation} mm</p>
                    <p>Humidity: {snapshot.humidity} %</p>
                    <p>Wind: {snapshot.windSpeed} m/s</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data yet. Choose a date/time and press Fetch.</p>
                )}
              </div>

              <div className="col-span-1">
                <h4 className="text-sm font-medium">Export / Series</h4>
                {timeSeries?.length ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <DataExport
                      weatherData={timeSeries}
                      location={location}
                      dateRange={{ start: selectedDateTime.split('T')[0], end: selectedDateTime.split('T')[0] }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No series available yet.</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="w-full text-right text-xs text-muted-foreground">Tip: You can select past or future dates. Future data is generated from baseline NASA values.</div>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdvancedOptionsMenu;