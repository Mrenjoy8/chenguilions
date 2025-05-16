import { useRef, useEffect } from 'react';
import { Direction } from '../core/types';

interface SwipeHandlers {
  onSwipe: (direction: Direction) => void;
  threshold?: number; // Minimum distance for a swipe to be detected
  timeout?: number;   // Maximum time for a swipe to be detected
}

const useSwipeDetection = ({
  onSwipe,
  threshold = 50,
  timeout = 300,
}: SwipeHandlers) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const processingTouchRef = useRef(false);

  const getHexDirection = (dx: number, dy: number): Direction => {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Normalize the angle to 0-360
    const normalizedAngle = (angle + 360) % 360;
    
    // Convert angle to hexagonal direction
    // Each direction spans 60 degrees
    // 0: NORTHEAST (0-60 degrees)
    // 1: EAST (60-120 degrees)
    // 2: SOUTHEAST (120-180 degrees)
    // 3: SOUTHWEST (180-240 degrees)
    // 4: WEST (240-300 degrees)
    // 5: NORTHWEST (300-360 degrees)
    
    if (normalizedAngle >= 330 || normalizedAngle < 30) {
      return Direction.EAST;
    } else if (normalizedAngle >= 30 && normalizedAngle < 90) {
      return Direction.SOUTHEAST;
    } else if (normalizedAngle >= 90 && normalizedAngle < 150) {
      return Direction.SOUTHWEST;
    } else if (normalizedAngle >= 150 && normalizedAngle < 210) {
      return Direction.WEST;
    } else if (normalizedAngle >= 210 && normalizedAngle < 270) {
      return Direction.NORTHWEST;
    } else {
      return Direction.NORTHEAST;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (processingTouchRef.current) return;
      
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      startTimeRef.current = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while swiping
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (processingTouchRef.current) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      
      const dx = endX - startXRef.current;
      const dy = endY - startYRef.current;
      const time = endTime - startTimeRef.current;
      
      // Check if the swipe was quick enough and long enough
      if (time <= timeout && Math.sqrt(dx * dx + dy * dy) >= threshold) {
        processingTouchRef.current = true;
        
        const direction = getHexDirection(dx, dy);
        onSwipe(direction);
        
        // Prevent multiple rapid swipes
        setTimeout(() => {
          processingTouchRef.current = false;
        }, 200);
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipe, threshold, timeout]);

  return { containerRef };
};

export default useSwipeDetection; 