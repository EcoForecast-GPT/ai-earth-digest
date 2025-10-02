import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fetchNASAWeatherData } from '@/services/nasaWeatherService';

const AdvancedOptionsMenu = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const fetchWeather = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const [year, month, day] = selectedDate.split('-');
      const data = await fetchNASAWeatherData(0, 0, `${year}-${month}-${day}`, `${year}-${month}-${day}`);
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full bg-gray-800 text-white p-4 fixed bottom-0 left-0"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <label htmlFor="date" className="text-sm font-medium">
            Select Date:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
          <button
            onClick={fetchWeather}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Get Weather
          </button>
        </div>
        <div className="mt-4 md:mt-0">
          {loading && <p>Loading...</p>}
          {weatherData && (
            <div>
              <h4 className="text-lg font-semibold">Weather Data:</h4>
              <pre className="bg-gray-700 p-2 rounded text-sm">
                {JSON.stringify(weatherData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdvancedOptionsMenu;