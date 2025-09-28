import { useState, useEffect } from 'react';
import { WeatherLocation } from '@/pages/Index';

interface LocationError {
  message: string;
  code?: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<WeatherLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);

  const getCityFromCoords = async (lat: number, lon: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim for reverse geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
      );
      const data = await response.json();
      
      const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown City';
      const state = data.address?.state || data.address?.country || '';
      
      return state ? `${city}, ${state}` : city;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  const getLocationByGPS = async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError({ message: 'Geolocation is not supported by this browser' });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const name = await getCityFromCoords(lat, lon);
        
        setLocation({ lat, lon, name });
        setLoading(false);
      },
      async (geoError) => {
        console.log('GPS failed, trying IP location...');
        await getLocationByIP();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  };

  const getLocationByIP = async () => {
    try {
      // Using ipapi.co for IP geolocation (free tier)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.reason || 'IP geolocation failed');
      }

      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      const name = `${data.city || 'Unknown'}, ${data.region || data.country_name || ''}`;
      
      setLocation({ lat, lon, name });
      setLoading(false);
    } catch (ipError) {
      setError({ 
        message: 'Unable to detect location. Please enter manually.',
        code: (ipError as any).code 
      });
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    await getLocationByGPS();
  };

  return {
    location,
    loading,
    error,
    requestLocation,
    setLocation
  };
};