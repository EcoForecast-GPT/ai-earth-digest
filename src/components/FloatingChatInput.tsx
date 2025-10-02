import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FloatingChatInputProps {
  weatherData: any;
  location: string;
}

export const FloatingChatInput = ({ weatherData, location }: FloatingChatInputProps) => {
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
    // This function remains for future use but is not currently displaying output
    const message = userMessage.toLowerCase();
    if (!weatherData) return "I'm currently gathering weather data. Please wait a moment!";
    if (message.includes('temperature')) return `The current temperature in ${location} is ${weatherData.temperature.toFixed(1)}°C.`;
    return `I can help you with weather information for ${location}!`;
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