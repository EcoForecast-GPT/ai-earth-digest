import { useEffect, useState } from 'react';
import { Progress } from './ui/progress';

interface ProgressTimerProps {
  duration?: number; // Duration in milliseconds
  onComplete?: () => void;
  isActive?: boolean;
  label?: string;
}

export const ProgressTimer = ({ 
  duration = 50000, // Default 50 seconds
  onComplete,
  isActive = false,
  label = 'Computing prediction...'
}: ProgressTimerProps) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(timer);
  }, [duration, isActive, onComplete]);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
};