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

  // SMARTER AI CHATBOT LOGIC
  const generateWeatherResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    if (!weatherData) return "I'm gathering weather data. Please wait!";
    const temp = weatherData?.temperature;
    const precip = weatherData?.precipitation;
    const humidity = weatherData?.humidity;
    const wind = weatherData?.windSpeed;
    const uv = weatherData?.uvIndex;
    const dateObj = selectedDate ? new Date(selectedDate) : new Date();
    const today = new Date();
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    // Contextual, multi-turn, and more detailed answers
    // 1. Future or past queries
    const isFuture = dateObj > today;
    const isPast = dateObj < today;
    if (/tomorrow|next week|future|will be|going to be|\d{4}-\d{2}-\d{2}|predict/.test(message) || isFuture) {
      let summary = `Here's my prediction for ${location} on ${dateStr}:\n`;
      summary += `• Temperature: ${Math.round(temp)}°C (${temp > 35 ? 'extreme heat' : temp > 30 ? 'very hot' : temp > 25 ? 'warm' : temp < 5 ? 'cold' : 'comfortable'})\n`;
      summary += `• Precipitation: ${Math.round(precip)}mm${precip > 50 ? ' (heavy rain!)' : precip > 10 ? ' (moderate rain)' : ' (light/no rain)'}\n`;
      summary += `• Humidity: ${Math.round(humidity)}%${humidity > 80 ? ' (very humid)' : ' (comfortable)'}\n`;
      summary += `• Wind: ${Math.round(wind)} km/h${wind > 20 ? ' (strong winds)' : ''}\n`;
      summary += uv !== undefined ? `• UV Index: ${Math.round(uv)}${uv > 8 ? ' (extreme)' : uv > 5 ? ' (high)' : ' (moderate)'}\n` : '';
      summary += temp > 35 ? '⚠️ Take precautions for extreme heat.\n' : '';
      summary += precip > 50 ? '☔ Flooding possible, avoid low-lying areas.\n' : '';
      summary += wind > 20 ? '💨 Secure loose objects outdoors.\n' : '';
      summary += 'Ask about specific risks or recommendations!';
      return summary;
    }
    if (/yesterday|last week|past|was|historical/.test(message) || isPast) {
      let summary = `Here's the historical weather for ${location} on ${dateStr}:\n`;
      summary += `• Temperature: ${Math.round(temp)}°C\n`;
      summary += `• Precipitation: ${Math.round(precip)}mm\n`;
      summary += `• Humidity: ${Math.round(humidity)}%\n`;
      summary += `• Wind: ${Math.round(wind)} km/h\n`;
      summary += uv !== undefined ? `• UV Index: ${Math.round(uv)}\n` : '';
      summary += 'Let me know if you want a summary or risk analysis!';
      return summary;
    }
    // 2. Specific variable queries
    if (/temperature|hot|cold|heat|chill/.test(message)) {
      if (temp !== undefined) {
        const feel = temp > 35 ? 'extreme heat' : temp > 30 ? 'very hot' : temp > 25 ? 'warm' : temp < 5 ? 'cold' : 'comfortable';
        return `Temperature in ${location}: ${Math.round(temp)}°C (${feel}).`;
      }
    }
    if (/rain|precipitation|wet|flood/.test(message)) {
      if (precip !== undefined) {
        return `Precipitation in ${location}: ${Math.round(precip)}mm${precip > 50 ? ' (heavy rain!)' : precip > 10 ? ' (moderate rain)' : ' (light/no rain)'}`;
      }
    }
    if (/humidity|humid|dry/.test(message)) {
      if (humidity !== undefined) {
        return `Humidity in ${location}: ${Math.round(humidity)}%${humidity > 80 ? ' (very humid)' : ' (comfortable)'}`;
      }
    }
    if (/wind|breeze|storm/.test(message)) {
      if (wind !== undefined) {
        return `Wind in ${location}: ${Math.round(wind)} km/h${wind > 20 ? ' (strong winds)' : wind > 10 ? ' (breezy)' : ''}`;
      }
    }
    if (/uv|sun|ultraviolet/.test(message)) {
      if (uv !== undefined) {
        return `UV Index in ${location}: ${Math.round(uv)}${uv > 8 ? ' (extreme)' : uv > 5 ? ' (high)' : ' (moderate)'}`;
      }
    }
    // 3. General or fallback
    return `I'm your smart weather assistant!\nAsk about temperature, rain, wind, humidity, UV, or request a future/past prediction for ${location}.`;
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