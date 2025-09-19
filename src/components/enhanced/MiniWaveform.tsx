import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MiniWaveformProps {
  audioRef?: React.RefObject<HTMLAudioElement>;
  isPlaying?: boolean;
  className?: string;
  bars?: number;
  height?: number;
}

export const MiniWaveform: React.FC<MiniWaveformProps> = ({
  audioRef,
  isPlaying = false,
  className = '',
  bars = 20,
  height = 32
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (!audioRef?.current || !isPlaying) return;

    const setupAudioContext = async () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyserNode = context.createAnalyser();
        const source = context.createMediaElementSource(audioRef.current!);
        
        source.connect(analyserNode);
        analyserNode.connect(context.destination);
        
        analyserNode.fftSize = 256;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        setAudioContext(context);
        setAnalyser(analyserNode);
        setDataArray(dataArray);
      } catch (error) {
        console.error('Failed to setup audio context:', error);
      }
    };

    setupAudioContext();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioRef, isPlaying]);

  const draw = () => {
    if (!canvasRef.current || !analyser || !dataArray) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.getByteFrequencyData(dataArray);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bars;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'hsl(264, 83%, 58%)');
    gradient.addColorStop(1, 'hsl(280, 83%, 63%)');

    for (let i = 0; i < bars; i++) {
      const barHeight = (dataArray[Math.floor(i * dataArray.length / bars)] / 255) * canvas.height;
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        i * barWidth + 1,
        canvas.height - barHeight,
        barWidth - 2,
        barHeight
      );
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  };

  useEffect(() => {
    if (isPlaying && analyser && dataArray) {
      draw();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyser, dataArray]);

  // Fallback animated bars when no audio context
  const renderFallbackBars = () => {
    if (!isPlaying) return null;

    return Array.from({ length: bars }, (_, i) => (
      <div
        key={i}
        className="bg-gradient-to-t from-primary to-primary/70 rounded-sm animate-wave"
        style={{
          width: '2px',
          height: `${Math.random() * height + 4}px`,
          animationDelay: `${i * 0.1}s`,
          animationDuration: `${0.5 + Math.random() * 0.5}s`
        }}
      />
    ));
  };

  return (
    <div className={cn("flex items-end justify-center gap-1", className)}>
      {audioContext && analyser ? (
        <canvas
          ref={canvasRef}
          width={bars * 4}
          height={height}
          className="w-full h-full"
        />
      ) : (
        renderFallbackBars()
      )}
    </div>
  );
};