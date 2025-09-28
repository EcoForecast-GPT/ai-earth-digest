import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { WeatherData } from '@/pages/Index';

interface WeatherBackgroundProps {
  weatherData: WeatherData[];
  className?: string;
}

const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ weatherData, className = '' }) => {
  const currentWeather = useMemo(() => {
    if (!weatherData.length) return null;
    const latest = weatherData[weatherData.length - 1];
    return {
      temp: latest.temperature,
      precipitation: latest.precipitation,
      humidity: latest.humidity,
      windSpeed: latest.windSpeed
    };
  }, [weatherData]);

  const getWeatherType = () => {
    if (!currentWeather) return 'default';
    
    if (currentWeather.precipitation > 10) return 'rainy';
    if (currentWeather.temp > 30) return 'sunny';
    if (currentWeather.temp < 5) return 'snowy';
    if (currentWeather.windSpeed > 10) return 'windy';
    if (currentWeather.humidity > 80) return 'foggy';
    
    return 'clear';
  };

  const weatherType = getWeatherType();

  const RainDrops = () => (
    <>
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-8 bg-gradient-to-b from-blue-400/70 to-blue-600/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10px`,
          }}
          animate={{
            y: ['0vh', '110vh'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );

  const SnowFlakes = () => (
    <>
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full opacity-80"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10px`,
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: ['-5px', '5px', '-5px'],
            rotate: [0, 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );

  const SunRays = () => (
    <motion.div
      className="absolute top-10 right-10 w-32 h-32"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 to-transparent rounded-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-16 bg-gradient-to-t from-yellow-400/50 to-transparent rounded-full origin-bottom"
            style={{
              transform: `rotate(${i * 45}deg)`,
              transformOrigin: '50% 100%',
              top: '50%',
              left: '50%',
              marginLeft: '-2px',
              marginTop: '-64px',
            }}
          />
        ))}
      </div>
    </motion.div>
  );

  const Clouds = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: `${Math.random() * 30 + 10}%`,
            left: `-20%`,
          }}
          animate={{
            x: ['0vw', '120vw'],
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: 'linear',
          }}
        >
          <div className="relative">
            <div className="w-16 h-8 bg-gray-300/20 rounded-full" />
            <div className="absolute -top-2 left-4 w-12 h-6 bg-gray-300/20 rounded-full" />
            <div className="absolute -top-1 left-8 w-10 h-5 bg-gray-300/20 rounded-full" />
          </div>
        </motion.div>
      ))}
    </>
  );

  const WindEffect = () => (
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-0.5 bg-gradient-to-r from-white/30 to-transparent rounded-full"
          style={{
            left: `-10%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: ['0vw', '110vw'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );

  const FogEffect = () => (
    <motion.div
      className="absolute inset-0 bg-gradient-to-t from-gray-400/10 via-gray-300/5 to-transparent"
      animate={{
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {weatherType === 'rainy' && <RainDrops />}
      {weatherType === 'snowy' && <SnowFlakes />}
      {weatherType === 'sunny' && <SunRays />}
      {weatherType === 'windy' && <WindEffect />}
      {weatherType === 'foggy' && <FogEffect />}
      {(weatherType === 'clear' || weatherType === 'default') && <Clouds />}
      
      {/* Aurora effect overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-aurora/5 via-transparent to-glow-secondary/5"
        animate={{
          opacity: [0.3, 0.7, 0.3],
          background: [
            'linear-gradient(45deg, hsl(var(--aurora) / 0.05), transparent, hsl(var(--glow-secondary) / 0.05))',
            'linear-gradient(225deg, hsl(var(--glow-secondary) / 0.05), transparent, hsl(var(--aurora) / 0.05))',
            'linear-gradient(45deg, hsl(var(--aurora) / 0.05), transparent, hsl(var(--glow-secondary) / 0.05))',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export default WeatherBackground;