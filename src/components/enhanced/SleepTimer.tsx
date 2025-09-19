import React, { useState, useEffect } from 'react';
import { Timer, Moon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SleepTimerProps {
  onTimerEnd?: () => void;
}

export const SleepTimer: React.FC<SleepTimerProps> = ({ onTimerEnd }) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const timerOptions = [
    { label: '5 minutes', minutes: 5 },
    { label: '10 minutes', minutes: 10 },
    { label: '15 minutes', minutes: 15 },
    { label: '30 minutes', minutes: 30 },
    { label: '45 minutes', minutes: 45 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            onTimerEnd?.();
            toast.success('😴 Sleep timer ended - Music stopped');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onTimerEnd]);

  const startTimer = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setIsActive(true);
    setIsOpen(false);
    toast.success(`🌙 Sleep timer set for ${minutes} minutes`);
  };

  const stopTimer = () => {
    setIsActive(false);
    setTimeLeft(0);
    toast.info('Sleep timer cancelled');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`w-8 h-8 relative ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
        >
          <Timer size={16} />
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            Sleep Timer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isActive && (
            <div className="text-center p-6 bg-primary/10 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary mb-1">
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-muted-foreground">remaining</p>
              <Button
                variant="outline"
                size="sm"
                onClick={stopTimer}
                className="mt-3"
              >
                Cancel Timer
              </Button>
            </div>
          )}

          {!isActive && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Music will automatically stop when the timer ends
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {timerOptions.map((option) => (
                  <Button
                    key={option.minutes}
                    variant="outline"
                    onClick={() => startTimer(option.minutes)}
                    className="h-12 text-sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};