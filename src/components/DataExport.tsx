import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, FileText, Database } from 'lucide-react';
import { TimePoint, WeatherLocation } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';

interface DataExportProps {
  weatherData: TimePoint[];
  location: WeatherLocation;
  dateRange: { start: string; end: string };
}

const DataExport: React.FC<DataExportProps> = ({ weatherData, location, dateRange }) => {
  const { toast } = useToast();

  const generateMetadata = () => ({
    source: 'NASA Weather Data',
    location: {
      name: location.name,
      coordinates: {
        latitude: location.lat,
        longitude: location.lon
      }
    },
    dateRange: {
      start: dateRange.start,
      end: dateRange.end
    },
    dataPoints: weatherData.length,
    variables: {
      temperature: { unit: '°C', description: 'Temperature in Celsius' },
      precipitation: { unit: 'mm', description: 'Precipitation in millimeters' },
      humidity: { unit: '%', description: 'Relative humidity percentage' },
      windSpeed: { unit: 'm/s', description: 'Wind speed in meters per second' }
    },
    generatedAt: new Date().toISOString(),
    apiSources: [
      'https://power.larc.nasa.gov/api/',
      'https://nominatim.openstreetmap.org/',
    ]
  });

  const exportAsJSON = () => {
    const exportData = {
      metadata: generateMetadata(),
      data: weatherData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather-data-${location.name.replace(/[^a-zA-Z0-9]/g, '-')}-${dateRange.start}-to-${dateRange.end}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Weather data exported as JSON file',
    });
  };

  const exportAsCSV = () => {
    const metadata = generateMetadata();
    
    // Create CSV header with metadata
    let csvContent = `# Weather Data Export\n`;
    csvContent += `# Location: ${metadata.location.name}\n`;
    csvContent += `# Coordinates: ${metadata.location.coordinates.latitude}, ${metadata.location.coordinates.longitude}\n`;
    csvContent += `# Date Range: ${metadata.dateRange.start} to ${metadata.dateRange.end}\n`;
    csvContent += `# Data Points: ${metadata.dataPoints}\n`;
    csvContent += `# Generated: ${metadata.generatedAt}\n`;
    csvContent += `# Source: ${metadata.source}\n\n`;
    
    // CSV headers
    csvContent += 'timestamp,temperature_celsius,precipitation_mm,humidity_percent,wind_speed_ms\n';
    
    // CSV data
    weatherData.forEach(row => {
      csvContent += `${row.timestamp},${row.temperature},${row.precipitation},${row.humidity},${row.windSpeed}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather-data-${location.name.replace(/[^a-zA-Z0-9]/g, '-')}-${dateRange.start}-to-${dateRange.end}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Weather data exported as CSV file',
    });
  };

  if (!weatherData.length) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row gap-2"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={exportAsCSV}
          variant="outline"
          size="sm"
          className="glass-card hover:glow-primary transition-all duration-300 group"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mr-2"
          >
            <FileText className="w-4 h-4 group-hover:text-aurora transition-colors" />
          </motion.div>
          Export CSV
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={exportAsJSON}
          variant="outline"
          size="sm"
          className="glass-card hover:glow-accent transition-all duration-300 group"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mr-2"
          >
            <Database className="w-4 h-4 group-hover:text-glow-secondary transition-colors" />
          </motion.div>
          Export JSON
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default DataExport;