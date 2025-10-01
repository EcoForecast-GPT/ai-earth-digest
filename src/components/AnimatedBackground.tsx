import { memo } from 'react';
import { useTheme } from './ThemeProvider';

export const AnimatedBackground = memo(() => {
  const { actualTheme } = useTheme();
  
  return (
    <div 
      className="animated-bg-container" 
      style={{ 
        background: actualTheme === 'light' ? 'hsl(40 40% 98%)' : 'hsl(0 0% 0%)' 
      }} 
    />
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';
