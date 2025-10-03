import { memo } from 'react';
import { useTheme } from './ThemeProvider';

export const AnimatedBackground = memo(() => {
  const { actualTheme } = useTheme();
  
  return (
    <div 
      className={actualTheme === 'light' ? '' : 'animated-bg-container'}
      style={{ 
        background: actualTheme === 'light' ? 'hsl(0 0% 100%)' : 'hsl(0 0% 0%)',
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        transition: 'background 0.3s ease'
      }} 
    />
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';
