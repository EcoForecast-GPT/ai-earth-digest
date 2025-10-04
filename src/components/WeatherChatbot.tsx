import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface WeatherChatbotProps {
  weatherData?: any;
  location?: string;
  selectedDate?: string;
  onPredictionRequest?: (query: string) => void;
}

export const WeatherChatbot = ({ weatherData, location, selectedDate, onPredictionRequest }: WeatherChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your weather assistant. I can help you understand current conditions${location ? ` for ${location}` : ''} and answer weather-related questions. What would you like to know?`,
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateWeatherResponse = async (userMessage: string): Promise<string> => {
    const message = userMessage.toLowerCase();
    
    // Enhanced future/past prediction detection
    const isFutureQuery = message.includes('tomorrow') || message.includes('next') || 
                          message.includes('future') || message.includes('will') ||
                          message.includes('going to') || /\d{4}-\d{2}-\d{2}/.test(message) ||
                          message.includes('predict') || message.includes('forecast') ||
                          message.includes('upcoming') || message.includes('ahead');
    
    const isPastQuery = message.includes('yesterday') || message.includes('last') ||
                        message.includes('past') || message.includes('was') ||
                        message.includes('historical') || message.includes('previous') ||
                        message.includes('ago');
    
    // Extract date from message if present
    const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/) || 
                     message.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    
    // Always respond intelligently to prediction queries with NASA data
    if (isFutureQuery || isPastQuery) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Use selectedDate if available, otherwise try to extract from message
      let queryDate = selectedDate;
      if (!queryDate && dateMatch) {
        queryDate = dateMatch[0];
      }
      
      if (queryDate) {
        try {
          // Fetch fresh data for the requested date
          const queryDateObj = new Date(queryDate);
          queryDateObj.setHours(0, 0, 0, 0);
          const isFuture = queryDateObj > today;
          const isPast = queryDateObj < today;
          
          const dateStr = queryDateObj.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          });
          
          const timeContext = isFuture ? '🔮 Future Prediction' : isPast ? '📊 Historical Data' : '📍 Current Conditions';
          
          // Fetch weather data for this specific date
          const { fetchNASAWeatherData } = await import('@/services/nasaWeatherService');
          
          // Extract coordinates from location or use defaults (Dubai)
          const lat = 25.2048; // Default to Dubai for testing
          const lon = 55.2708;
          
          console.log(`[DEBUG] Fetching weather for ${dateStr} at lat:${lat}, lon:${lon}`);
          
          const fetchedData = await fetchNASAWeatherData(lat, lon, queryDate);
          
          console.log(`[DEBUG] Raw fetched data:`, fetchedData);
          
          // Build comprehensive response
          let response = `${timeContext} for ${dateStr}${location ? ` in ${location}` : ''}:\n\n`;
          response += `🌡️ Temperature: ${fetchedData.temperature?.toFixed(1)}°C\n`;
          response += `💧 Humidity: ${fetchedData.humidity?.toFixed(1)}%\n`;
          response += `🌧️ Precipitation: ${fetchedData.precipitation?.toFixed(1)}mm\n`;
          response += `💨 Wind Speed: ${fetchedData.windSpeed?.toFixed(1)} m/s\n`;
          if (fetchedData.uvIndex !== undefined) {
            response += `☀️ UV Index: ${fetchedData.uvIndex?.toFixed(1)}\n`;
          }
          response += `\n`;
          
          // Intelligent condition analysis
          if (fetchedData.precipitation >= 50) {
            response += '⚠️ Heavy rain expected - Stay indoors if possible!';
          } else if (fetchedData.humidity > 80 && fetchedData.precipitation < 50) {
            response += '🌫️ High humidity with haze - Visibility may be reduced';
          } else if (fetchedData.temperature > 38) {
            response += '🔥 Extreme heat - Stay hydrated and avoid midday sun!';
          } else if (fetchedData.temperature > 32) {
            response += '☀️ Very hot conditions - Use sun protection';
          } else if (fetchedData.temperature < 5) {
            response += '❄️ Cold weather - Dress warmly';
          } else if (fetchedData.temperature >= 20 && fetchedData.temperature <= 28) {
            response += '✨ Perfect weather conditions!';
          } else {
            response += '🌤️ Moderate conditions';
          }
          
          return response;
        } catch (error) {
          console.error('[DEBUG] Error fetching weather data:', error);
          return `I encountered an error fetching weather data. Please try again or select a date using the date picker.`;
        }
      } else if (weatherData) {
        // Fallback to currently loaded data if no specific date
        const queryDateObj = selectedDate ? new Date(selectedDate) : new Date();
        queryDateObj.setHours(0, 0, 0, 0);
        const isFuture = queryDateObj > today;
        const isPast = queryDateObj < today;
        
        const dateStr = queryDateObj.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        const timeContext = isFuture ? '🔮 Future Prediction' : isPast ? '📊 Historical Data' : '📍 Current Conditions';
        
        let response = `${timeContext} for ${dateStr}${location ? ` in ${location}` : ''}:\n\n`;
        response += `🌡️ Temperature: ${weatherData.temperature?.toFixed(1)}°C\n`;
        response += `💧 Humidity: ${weatherData.humidity?.toFixed(1)}%\n`;
        response += `🌧️ Precipitation: ${weatherData.precipitation?.toFixed(1)}mm\n`;
        response += `💨 Wind Speed: ${weatherData.windSpeed?.toFixed(1)} m/s\n`;
        if (weatherData.uvIndex !== undefined) {
          response += `☀️ UV Index: ${weatherData.uvIndex?.toFixed(1)}\n`;
        }
        response += `\n`;
        
        if (weatherData.precipitation >= 50) {
          response += '⚠️ Heavy rain expected - Stay indoors if possible!';
        } else if (weatherData.humidity > 80 && weatherData.precipitation < 50) {
          response += '🌫️ High humidity with haze - Visibility may be reduced';
        } else if (weatherData.temperature > 38) {
          response += '🔥 Extreme heat - Stay hydrated and avoid midday sun!';
        } else if (weatherData.temperature > 32) {
          response += '☀️ Very hot conditions - Use sun protection';
        } else if (weatherData.temperature < 5) {
          response += '❄️ Cold weather - Dress warmly';
        } else if (weatherData.temperature >= 20 && weatherData.temperature <= 28) {
          response += '✨ Perfect weather conditions!';
        } else {
          response += '🌤️ Moderate conditions';
        }
        
        return response;
      }
      
      // Guide user to select a date
      return `To get ${isFutureQuery ? 'future predictions' : 'historical data'}, please select a date using the date picker above or mention a specific date (e.g., "2025-10-02") in your message!`;
    }
    
    // Extract weather data if available
    const temp = weatherData?.temperature;
    const precip = weatherData?.precipitation;
    const wind = weatherData?.windSpeed;
    const humidity = weatherData?.humidity;
    
    if (message.includes('temperature') || message.includes('hot') || message.includes('cold')) {
      if (temp !== undefined) {
        const feel = temp > 30 ? 'very hot' : temp > 25 ? 'warm' : temp > 15 ? 'comfortable' : temp > 5 ? 'cool' : 'cold';
        return `Current temperature${location ? ` in ${location}` : ''} is ${temp.toFixed(1)}°C, which feels ${feel}. ${temp > 30 ? 'Stay hydrated and seek shade during peak hours.' : temp < 5 ? 'Dress warmly and watch for frost.' : 'Good conditions for most outdoor activities.'}`;
      }
      return `Temperature data is loading. Generally, check the hourly forecast for temperature variations throughout the day.`;
    }
    
    if (message.includes('rain') || message.includes('precipitation') || message.includes('wet')) {
      if (precip !== undefined) {
        const rainLevel = precip > 10 ? 'heavy' : precip > 5 ? 'moderate' : precip > 1 ? 'light' : 'minimal';
        return `Precipitation${location ? ` in ${location}` : ''} is ${precip.toFixed(1)}mm/h (${rainLevel}). ${precip > 10 ? 'Heavy rain expected - indoor activities recommended.' : precip > 5 ? 'Bring an umbrella and waterproof gear.' : 'Mostly dry conditions.'}`;
      }
      return `Precipitation data is loading. Check the radar and hourly forecasts for accurate timing.`;
    }
    
    if (message.includes('wind') || message.includes('windy')) {
      if (wind !== undefined) {
        const windLevel = wind > 20 ? 'very windy' : wind > 15 ? 'windy' : wind > 10 ? 'breezy' : 'calm';
        return `Wind speed${location ? ` in ${location}` : ''} is ${wind.toFixed(1)} km/h (${windLevel}). ${wind > 20 ? 'Strong winds may affect outdoor activities.' : wind > 15 ? 'Noticeable wind - secure loose objects.' : 'Pleasant wind conditions.'}`;
      }
      return `Wind data is loading. Check both speed and gusts for outdoor planning.`;
    }
    
    if (message.includes('humidity') || message.includes('humid') || message.includes('uncomfortable')) {
      if (humidity !== undefined) {
        const humidLevel = humidity > 80 ? 'very humid' : humidity > 60 ? 'humid' : humidity > 40 ? 'comfortable' : 'dry';
        return `Humidity${location ? ` in ${location}` : ''} is ${humidity.toFixed(0)}% (${humidLevel}). ${humidity > 80 ? 'Very uncomfortable - stay cool and hydrated.' : humidity > 60 ? 'Moderately humid conditions.' : 'Comfortable humidity levels.'}`;
      }
      return `Humidity data is loading. High humidity can make temperatures feel warmer.`;
    }
    
    if (message.includes('forecast') || message.includes('tomorrow') || message.includes('week')) {
      return `The forecast shows evolving patterns${location ? ` for ${location}` : ''}. Check the time-series chart for hourly trends. Weather can change quickly, so check back regularly for updates.`;
    }
    
    if (message.includes('outdoor') || message.includes('activity') || message.includes('hiking') || message.includes('sports')) {
      let advice = 'For outdoor activities, current conditions: ';
      const factors = [];
      if (temp !== undefined) factors.push(`${temp.toFixed(0)}°C`);
      if (wind !== undefined) factors.push(`${wind.toFixed(0)} km/h wind`);
      if (precip !== undefined && precip > 1) factors.push(`${precip.toFixed(1)}mm rain`);
      
      return advice + (factors.length > 0 ? factors.join(', ') + '. ' : '') + 
        'Check UV levels for sun exposure and watch for weather changes.';
    }
    
    if (message.includes('current') || message.includes('now') || message.includes('today')) {
      if (weatherData) {
        return `Current conditions${location ? ` in ${location}` : ''}: Temperature ${temp?.toFixed(1)}°C, Wind ${wind?.toFixed(1)} km/h, Precipitation ${precip?.toFixed(1)}mm/h, Humidity ${humidity?.toFixed(0)}%. Check the dashboard for detailed forecasts.`;
      }
    }
    
    return `I can help with weather info${location ? ` for ${location}` : ''}! Ask about temperature, rain, wind, humidity, or current conditions. What would you like to know?`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Generate response (now async to fetch data)
      const responseText = await generateWeatherResponse(userInput);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I encountered an error processing your request. Please try again.',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1,
        y: [0, -8, 0],
        transition: {
          y: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      }}
      className="fixed left-0 right-0 bottom-6 mx-auto w-[85vw] md:w-[400px] lg:w-[450px] h-[40vh] md:h-[32rem] glass-card rounded-xl border border-border/50 backdrop-blur-xl z-50 flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="p-2 rounded-lg bg-primary/20 border border-primary/30"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Weather Assistant</h3>
            <p className="text-xs text-muted-foreground">AI-powered weather insights</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-start gap-2 max-w-[80%] ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`p-2 rounded-lg border ${
                      message.isBot 
                        ? 'bg-primary/20 border-primary/30 text-primary' 
                        : 'bg-accent/20 border-accent/30 text-accent'
                    }`}
                  >
                    {message.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </motion.div>
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      message.isBot
                        ? 'bg-card/60 border border-border/30 text-card-foreground'
                        : 'bg-primary/20 border border-primary/30 text-foreground'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-2">
                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 text-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-3 py-2 rounded-lg bg-card/60 border border-border/30">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/30 bg-gradient-to-r from-card/50 to-card/30">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about weather conditions..."
            className="flex-1 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary hover:text-primary"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              <Send className="w-4 h-4" />
            </motion.div>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};