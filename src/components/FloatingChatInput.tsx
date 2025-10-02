import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface FloatingChatInputProps {
  weatherData: any;
  location: string;
}

export const FloatingChatInput = ({ weatherData, location }: FloatingChatInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateWeatherResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (!weatherData) {
      return "I'm currently gathering weather data. Please wait a moment!";
    }

    // Temperature queries
    if (message.includes('temperature') || message.includes('temp') || message.includes('hot') || message.includes('cold') || message.includes('warm')) {
      return `The current temperature in ${location} is ${weatherData.temperature.toFixed(1)}°C. ${
        weatherData.temperature > 30 ? 'It\'s quite hot outside!' : 
        weatherData.temperature < 10 ? 'It\'s quite cold, bundle up!' : 
        'The temperature is comfortable.'
      }`;
    }

    // Rain/precipitation queries
    if (message.includes('rain') || message.includes('precipitation') || message.includes('wet')) {
      return `Current precipitation in ${location} is ${weatherData.precipitation.toFixed(1)}mm. ${
        weatherData.precipitation > 10 ? 'Expect significant rainfall.' : 
        weatherData.precipitation > 0 ? 'Light rain is expected.' : 
        'No rain expected.'
      }`;
    }

    // Wind queries
    if (message.includes('wind') || message.includes('windy') || message.includes('breeze')) {
      return `Wind speed in ${location} is ${weatherData.windSpeed.toFixed(1)} m/s. ${
        weatherData.windSpeed > 10 ? 'It\'s quite windy!' : 
        weatherData.windSpeed > 5 ? 'There\'s a moderate breeze.' : 
        'Wind is calm.'
      }`;
    }

    // Humidity queries
    if (message.includes('humidity') || message.includes('humid') || message.includes('muggy')) {
      return `Current humidity in ${location} is ${weatherData.humidity.toFixed(0)}%. ${
        weatherData.humidity > 70 ? 'It\'s quite humid.' : 
        weatherData.humidity < 30 ? 'The air is quite dry.' : 
        'Humidity levels are comfortable.'
      }`;
    }

    // UV Index queries
    if (message.includes('uv') || message.includes('sun') || message.includes('sunburn')) {
      return `UV Index in ${location} is ${weatherData.uvIndex.toFixed(1)}. ${
        weatherData.uvIndex > 7 ? 'UV levels are high - use sunscreen!' : 
        weatherData.uvIndex > 3 ? 'Moderate UV levels.' : 
        'UV levels are low.'
      }`;
    }

    // General weather queries
    if (message.includes('weather') || message.includes('forecast') || message.includes('today')) {
      return `Current weather in ${location}: Temperature is ${weatherData.temperature.toFixed(1)}°C, humidity at ${weatherData.humidity.toFixed(0)}%, wind speed ${weatherData.windSpeed.toFixed(1)} m/s, and precipitation ${weatherData.precipitation.toFixed(1)}mm. UV Index is ${weatherData.uvIndex.toFixed(1)}.`;
    }

    // Activity suggestions
    if (message.includes('activity') || message.includes('do') || message.includes('should i')) {
      if (weatherData.precipitation > 5) {
        return "It's rainy, so indoor activities are recommended!";
      } else if (weatherData.temperature > 25 && weatherData.uvIndex < 7) {
        return "Great weather for outdoor activities! Don't forget sunscreen.";
      } else if (weatherData.temperature < 10) {
        return "It's cold outside. If you go out, dress warmly!";
      }
      return "Weather conditions are good for most outdoor activities!";
    }

    return `I can help you with weather information for ${location}! Ask me about temperature, rain, wind, humidity, UV index, or general weather conditions.`;
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
    setInput('');
    setIsLoading(true);

    // Simulate thinking time
    setTimeout(() => {
      const response = generateWeatherResponse(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md mx-auto px-4 z-50"
          >
            <div className="glass-panel rounded-3xl shadow-2xl border border-primary/20 overflow-hidden backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-card/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-foreground">Weather Assistant</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="hover:bg-destructive/20 rounded-full h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="h-96 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
                      <p className="text-muted-foreground text-sm">
                        Ask me anything about the weather!
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Example: "How is the weather today?"
                      </p>
                    </motion.div>
                  )}
                  
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          message.isBot
                            ? 'bg-card/80 text-foreground border border-border/40'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-card/80 rounded-2xl px-4 py-2.5 border border-border/40">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Input */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 left-0 right-0 w-full max-w-md mx-auto px-4 z-50"
      >
        <motion.div
          animate={{ 
            y: [0, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="glass-panel rounded-full shadow-2xl border border-primary/30 overflow-hidden backdrop-blur-xl hover:border-primary/50 transition-all duration-300"
        >
          <div className="flex items-center gap-2 p-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsExpanded(true)}
              placeholder="Ask Me Anything. Example: 'How is the weather today?'"
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
        </motion.div>
      </motion.div>
    </>
  );
};