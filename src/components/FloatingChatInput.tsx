import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FloatingChatInputProps {
  weatherData: any;
  location: string;
  selectedDate?: string;
  onPredictionRequest?: (query: string) => void;
}

export const FloatingChatInput = ({ weatherData, location, selectedDate, onPredictionRequest }: FloatingChatInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (input === '') {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [input]);

  const generateWeatherResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check for future/past prediction requests
    const isFutureQuery = message.includes('tomorrow') || message.includes('next week') || 
                          message.includes('future') || message.includes('will be') ||
                          message.includes('going to be') || /\d{4}-\d{2}-\d{2}/.test(message) ||
                          message.includes('predict');
    
    const isPastQuery = message.includes('yesterday') || message.includes('last week') ||
                        message.includes('past') || message.includes('was') ||
                        message.includes('historical');
    
    if (isFutureQuery || isPastQuery) {
      const today = new Date().toISOString().split('T')[0];
      const queryDate = selectedDate !== today;
      
      if (queryDate && weatherData) {
        const dateObj = new Date(selectedDate || today);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const timeContext = selectedDate && selectedDate > today ? 'prediction for' : 'data from';
        
        return `Based on my analysis ${timeContext} ${dateStr} in ${location}: ` +
               `Temperature: ${weatherData.temperature?.toFixed(1)}°C, ` +
               `Precipitation: ${weatherData.precipitation?.toFixed(1)}mm, ` +
               `Humidity: ${weatherData.humidity?.toFixed(0)}%, ` +
               `Wind: ${weatherData.windSpeed?.toFixed(1)} km/h. ` +
               `${weatherData.temperature > 35 ? 'Extremely hot conditions!' : 
                 weatherData.temperature > 30 ? 'Hot weather expected.' : 
                 weatherData.temperature < 5 ? 'Cold conditions.' : 'Comfortable range.'}`;
      }
      
      if (onPredictionRequest) {
        onPredictionRequest(userMessage);
        return `Select a future date and I'll provide an accurate prediction for ${location}!`;
      }
      
      return `Select a date to get predictions or historical data for ${location}!`;
    }
    
    if (!weatherData) return "I'm gathering weather data. Please wait!";
    
    const temp = weatherData?.temperature;
    const precip = weatherData?.precipitation;
    const humidity = weatherData?.humidity;
    
    if (message.includes('temperature') || message.includes('hot') || message.includes('cold')) {
      if (temp !== undefined) {
        const feel = temp > 30 ? 'very hot' : temp > 25 ? 'warm' : temp > 15 ? 'comfortable' : 'cool';
        return `Temperature in ${location}: ${temp.toFixed(1)}°C (${feel})`;
      }
    }
    
    if (message.includes('rain') || message.includes('precipitation')) {
      if (precip !== undefined) {
        return `Precipitation in ${location}: ${precip.toFixed(1)}mm${precip > 50 ? ' - heavy rain!' : precip > 10 ? ' - moderate rain' : ' - light/no rain'}`;
      }
    }
    
    if (message.includes('humidity')) {
      if (humidity !== undefined) {
        return `Humidity in ${location}: ${humidity.toFixed(0)}%${humidity > 80 ? ' - very humid' : ' - comfortable'}`;
      }
    }
    
    return `Ask me about temperature, rain, humidity, or future/past predictions for ${location}!`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const response = generateWeatherResponse(input);
      setChatResponse(response);
      setInput('');
      setIsLoading(false);
      // Keep it expanded to show the response
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    setChatResponse(''); // Clear response when user starts typing again
  };

  const widthVariants = {
    collapsed: { maxWidth: '24rem' }, // max-w-md
    expanded: { maxWidth: '42rem' },  // max-w-2xl
  };

  return (
    <motion.div
      ref={containerRef}
      initial="collapsed"
      animate={isExpanded ? 'expanded' : 'collapsed'}
      variants={widthVariants}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 left-0 right-0 w-full mx-auto px-4 z-50"
    >
      <div className="relative">
        <AnimatePresence>
          {chatResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute bottom-full left-0 right-0 mb-3"
            >
              <div className="glass-panel rounded-xl p-3 text-sm shadow-lg border border-primary/20">
                {chatResponse}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-panel rounded-full shadow-2xl border border-primary/30 overflow-hidden backdrop-blur-xl hover:border-primary/50 transition-all duration-300">
          <div className="flex items-center gap-2 p-2">
            {!isExpanded && (
              <div className="flex items-center gap-2 pl-2 pr-1 text-muted-foreground/80">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Ask AI</span>
              </div>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={handleFocus}
              placeholder={isExpanded ? "Ask about temperature, rain, wind..." : ""}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/60"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="rounded-full h-9 w-9 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};