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
}

export const WeatherChatbot = ({ weatherData, location }: WeatherChatbotProps) => {
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

  const generateWeatherResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('temperature') || message.includes('hot') || message.includes('cold')) {
      return `Based on current conditions${location ? ` in ${location}` : ''}, the temperature is showing typical seasonal patterns. For outdoor activities, I'd recommend checking the hourly forecast and considering layers for temperature variations throughout the day.`;
    }
    
    if (message.includes('rain') || message.includes('precipitation') || message.includes('wet')) {
      return `Precipitation patterns${location ? ` for ${location}` : ''} can vary significantly. I'd recommend checking the radar data and hourly forecasts. For outdoor activities, having backup plans is always wise when there's precipitation in the forecast.`;
    }
    
    if (message.includes('wind') || message.includes('windy')) {
      return `Wind conditions are important for many outdoor activities. Strong winds can affect everything from hiking to water sports. I'd suggest checking both current wind speeds and gusts, as well as the hourly forecast for wind direction changes.`;
    }
    
    if (message.includes('forecast') || message.includes('tomorrow') || message.includes('week')) {
      return `The extended forecast shows evolving weather patterns. I recommend checking multiple timeframes - hourly for detailed short-term planning and daily for general weekly trends. Weather can change quickly, so regular updates are helpful.`;
    }
    
    if (message.includes('outdoor') || message.includes('activity') || message.includes('hiking') || message.includes('sports')) {
      return `For outdoor activities, consider multiple weather factors: temperature, precipitation probability, wind conditions, and visibility. Also check UV levels for sun exposure and atmospheric pressure changes that might affect comfort levels.`;
    }
    
    return `That's a great weather question! Weather patterns are complex and influenced by many factors. I'd recommend checking the specific weather variables most relevant to your needs. Is there a particular aspect of the weather you're most concerned about for your plans?`;
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

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateWeatherResponse(input),
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
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
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 w-96 h-[32rem] glass-card rounded-xl border border-border/50 backdrop-blur-xl z-50 flex flex-col overflow-hidden"
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