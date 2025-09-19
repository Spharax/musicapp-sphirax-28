import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface GestureControlsProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const GestureControls: React.FC<GestureControlsProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  children,
  className = '',
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      const minSwipeDistance = 50;
      const maxSwipeTime = 500;

      // Check for swipe gestures
      if (Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.();
            toast.success('⏭️ Next track');
          } else {
            onSwipeLeft?.();
            toast.success('⏮️ Previous track');
          }
        }
      } else if (Math.abs(deltaY) > minSwipeDistance && deltaTime < maxSwipeTime) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
        // Handle tap (potential double tap)
        tapCountRef.current++;
        
        if (tapCountRef.current === 1) {
          tapTimeoutRef.current = setTimeout(() => {
            tapCountRef.current = 0;
          }, 300);
        } else if (tapCountRef.current === 2) {
          clearTimeout(tapTimeoutRef.current);
          tapCountRef.current = 0;
          onDoubleTap?.();
          toast.success('⏯️ Play/Pause');
        }
      }

      touchStartRef.current = null;
    };

    // Mouse events for desktop
    let mouseStart: { x: number; y: number; time: number } | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      mouseStart = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
      };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!mouseStart) return;

      const deltaX = e.clientX - mouseStart.x;
      const deltaY = e.clientY - mouseStart.y;
      const deltaTime = Date.now() - mouseStart.time;

      const minSwipeDistance = 100;
      const maxSwipeTime = 500;

      if (Math.abs(deltaX) > minSwipeDistance && deltaTime < maxSwipeTime) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) {
            onSwipeRight?.();
            toast.success('⏭️ Next track');
          } else {
            onSwipeLeft?.();
            toast.success('⏮️ Previous track');
          }
        }
      }

      mouseStart = null;
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onSwipeLeft?.();
          toast.success('⏮️ Previous track');
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSwipeRight?.();
          toast.success('⏭️ Next track');
          break;
        case 'ArrowUp':
          e.preventDefault();
          onSwipeUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onSwipeDown?.();
          break;
        case ' ':
          e.preventDefault();
          onDoubleTap?.();
          toast.success('⏯️ Play/Pause');
          break;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [disabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ touchAction: 'none' }}
    >
      {children}
    </div>
  );
};