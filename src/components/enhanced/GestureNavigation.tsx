import React, { useRef, useEffect } from 'react';
import { usePerformanceOptimization } from '@/hooks/performance/usePerformanceOptimization';

interface GestureNavigationProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const GestureNavigation: React.FC<GestureNavigationProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress,
  children,
  className = '',
  disabled = false
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { provideFeedback } = usePerformanceOptimization();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    let isLongPressing = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      // Start long press detection
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          isLongPressing = true;
          onLongPress();
          provideFeedback('medium');
        }, 500);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press if finger moves too much
      if (longPressTimerRef.current && touchStartRef.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        
        if (deltaX > 10 || deltaY > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (isLongPressing) {
        isLongPressing = false;
        return;
      }

      const touchStart = touchStartRef.current;
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const deltaTime = Date.now() - touchStart.time;

      const minSwipeDistance = 50;
      const maxSwipeTime = 300;

      // Check for swipes
      if (deltaTime < maxSwipeTime) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
            provideFeedback('light');
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
            provideFeedback('light');
          }
        } else if (Math.abs(deltaY) > minSwipeDistance) {
          // Vertical swipe
          if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
            provideFeedback('light');
          } else if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
            provideFeedback('light');
          }
        } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
          // Tap detection for double tap
          const currentTime = Date.now();
          const timeSinceLastTap = currentTime - lastTapTimeRef.current;
          
          if (timeSinceLastTap < 300 && onDoubleTap) {
            // Double tap
            onDoubleTap();
            provideFeedback('medium');
            lastTapTimeRef.current = 0; // Reset to prevent triple tap
          } else {
            lastTapTimeRef.current = currentTime;
          }
        }
      }

      touchStartRef.current = null;
    };

    // Mouse events for desktop testing
    let mouseStartRef: { x: number; y: number; time: number } | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      mouseStartRef = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
      };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!mouseStartRef) return;

      const deltaX = e.clientX - mouseStartRef.x;
      const deltaY = e.clientY - mouseStartRef.y;
      const deltaTime = Date.now() - mouseStartRef.time;

      const minSwipeDistance = 100; // Larger for mouse
      const maxSwipeTime = 300;

      if (deltaTime < maxSwipeTime) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          } else if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          }
        }
      }

      mouseStartRef = null;
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [disabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, onLongPress, provideFeedback]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};