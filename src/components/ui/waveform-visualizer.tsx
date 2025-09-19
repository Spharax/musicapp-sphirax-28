import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  isPlaying?: boolean;
  className?: string;
  bars?: number;
  height?: number;
  color?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying = false,
  className,
  bars = 32,
  height = 60,
  color = 'hsl(var(--primary))'
}) => {
  const [waveData, setWaveData] = useState<number[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Initialize with random heights
    setWaveData(Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2));
  }, [bars]);

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setWaveData(prev => 
          prev.map((_, index) => {
            const base = Math.sin(Date.now() * 0.005 + index * 0.5) * 0.3 + 0.5;
            const noise = Math.random() * 0.4;
            return Math.min(Math.max(base + noise, 0.1), 1);
          })
        );
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Animate to resting state
      setWaveData(prev => 
        prev.map(() => Math.random() * 0.3 + 0.1)
      );
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div 
      className={cn("flex items-end justify-center gap-1", className)}
      style={{ height: `${height}px` }}
    >
      {waveData.map((amplitude, index) => (
        <div
          key={index}
          className="bg-gradient-to-t from-primary via-secondary to-accent rounded-full transition-all duration-100 ease-out animate-wave"
          style={{
            height: `${amplitude * height}px`,
            width: `${Math.max(2, Math.floor(120 / bars))}px`,
            animationDelay: `${index * 0.05}s`,
            filter: isPlaying ? 'drop-shadow(0 0 4px currentColor)' : 'none',
            opacity: isPlaying ? 1 : 0.6,
          }}
        />
      ))}
    </div>
  );
};