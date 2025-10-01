import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NASAWeatherData, HistoricalDataPoint } from "@/services/nasaApi";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

interface WeatherChatbotProps {
  weatherData: NASAWeatherData | null;
  historicalData: HistoricalDataPoint[];
  location: string;
}

export const WeatherChatbot = ({ weatherData, historicalData, location }: WeatherChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const generateWeatherResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    if (message.includes('history') || message.includes('historical') || message.includes('last year')) {
      if (!historicalData || historicalData.length === 0) {
        return "I don't have historical data available at the moment. It might still be loading.";
      }
      const validTemps = historicalData.map(d => d.temperature).filter(t => t !== null) as number[];
      const avgTemp = validTemps.reduce((a, b) => a + b, 0) / validTemps.length;
      const totalPrecip = historicalData.map(d => d.precipitation).filter(p => p !== null).reduce((a, b) => a + b, 0);
      return `Over the last year in ${location}, the average temperature was ${avgTemp.toFixed(1)}°C, with a total precipitation of approximately ${totalPrecip.toFixed(1)} mm.`;
    }

    if (message.includes('forecast') || message.includes('tomorrow')) {
      return "I can only access historical and current weather data from NASA. I do not have forecasting capabilities.";
    }

    if (!weatherData) {
      return "I'm still waiting for the latest weather data. Please ask again in a moment.";
    }

    if (message.includes('temperature') || message.includes('temp')) {
      return `The current temperature in ${location} is ${weatherData.temperature.toFixed(1)}°C.`;
    }

    if (message.includes('rain') || message.includes('precipitation')) {
      return `Current precipitation in ${location} is ${weatherData.precipitation.toFixed(1)} mm/hr.`;
    }

    if (message.includes('wind')) {
      return `The wind speed in ${location} is ${weatherData.windSpeed.toFixed(1)} m/s.`;
    }

    return `I can provide current and historical weather data for ${location}. Ask me about temperature, precipitation, wind, or history.`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), text: input, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const response = generateWeatherResponse(input);
      const botMessage: Message = { id: (Date.now() + 1).toString(), text: response, isBot: true };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Button size="icon" className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl glow-primary">
            <MessageSquare className="w-8 h-8" />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] h-[70vh] flex flex-col p-0 glass-panel">
        <DialogHeader className="p-4 border-b border-border/30">
          <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Weather Assistant</DialogTitle>
        </DialogHeader>
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map(msg => {
              const Icon = msg.isBot ? Bot : User;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.isBot ? '' : 'flex-row-reverse'}`}>
                    <div className={`p-2 rounded-full border ${msg.isBot ? 'bg-card text-primary' : 'bg-primary text-primary-foreground'}`}><Icon className="w-4 h-4" /></div>
                    <div className={`px-3 py-2 rounded-lg border ${msg.isBot ? 'bg-card' : 'bg-primary/10'}`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                 <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="p-2 rounded-full border bg-card text-primary"><Bot className="w-4 h-4" /></div>
                  <div className="px-3 py-2 rounded-lg border bg-card"><Loader2 className="w-4 h-4 animate-spin" /></div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border/30">
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Ask about the weather..." disabled={isLoading} />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon"><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};