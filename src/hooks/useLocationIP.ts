import { useState, useEffect } from 'react';

interface LocationData {
  lat: number;
  lon: number;
  name: string;
  source: 'gps' | 'ip' | 'manual';
}

interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
}

export const useLocationIP = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestGPSLocation = async (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get city name
          try {
            const cityName = await reverseGeocode(latitude, longitude);
            resolve({
              lat: latitude,
              lon: longitude,
              name: cityName,
              source: 'gps'
            });
          } catch {
            resolve({
              lat: latitude,
              lon: longitude,
              name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
              source: 'gps'
            });
          }
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  const getIPLocation = async (): Promise<LocationData | null> => {
    try {
      // Using ipapi.co as a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      const data: IPLocationResponse = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lon: data.longitude,
          name: `${data.city}, ${data.region}`,
          source: 'ip'
        };
      }
    } catch (error) {
      console.error('IP location failed:', error);
    }
    
    return null;
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      // Mock reverse geocoding - in production use a real service
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=YOUR_API_KEY`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const location = data[0];
          return `${location.name}, ${location.state || location.country}`;
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    
    // Fallback to coordinates
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  };

  const initializeLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Priority 1: Try GPS location first
      const gpsLocation = await requestGPSLocation();
      
      if (gpsLocation) {
        setLocation(gpsLocation);
        setIsLoading(false);
        return;
      }

      // Priority 2: Fall back to IP location
      const ipLocation = await getIPLocation();
      
      if (ipLocation) {
        setLocation(ipLocation);
        setIsLoading(false);
        return;
      }

      // Priority 3: Default location (New York)
      setLocation({
        lat: 40.7128,
        lon: -74.0060,
        name: 'New York, NY',
        source: 'manual'
      });
      
    } catch (err) {
      setError('Failed to get location');
      // Still set a default location
      setLocation({
        lat: 40.7128,
        lon: -74.0060,
        name: 'New York, NY',
        source: 'manual'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = (newLocation: Omit<LocationData, 'source'>) => {
    setLocation({
      ...newLocation,
      source: 'manual'
    });
  };

  const refreshLocation = () => {
    initializeLocation();
  };

  // Initialize on mount - only once
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (mounted) {
        await initializeLocation();
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array ensures this only runs once

  return {
    location,
    isLoading,
    error,
    updateLocation,
    refreshLocation,
    requestGPS: requestGPSLocation
  };
};