
import React, { useEffect, useState, useRef } from 'react';

interface SheilaAnimationProps {
  gameWidth: number;
  floorLevel: number;
  onComplete?: () => void;
}

const SheilaAnimation: React.FC<SheilaAnimationProps> = ({ 
  gameWidth, 
  floorLevel,
  onComplete 
}) => {
  const [position, setPosition] = useState({ x: -80, y: 0 });
  const [isAnimating, setIsAnimating] = useState(true);
  const [walkFrame, setWalkFrame] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const ANIMATION_SPEED = 0.15; // pixels per millisecond

  useEffect(() => {
    if (!isAnimating || gameWidth === 0) return;
    
    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      // Update position
      setPosition(prev => {
        const newX = prev.x + ANIMATION_SPEED * deltaTime;
        
        // Update walk frame every 200ms for animation
        if (timestamp % 200 < 20) {
          setWalkFrame(prev => (prev + 1) % 2);
        }
        
        // Log animation progress for debugging
        console.log('Sheila animation in progress', {
          progress: newX / gameWidth,
          newX,
          gameWidth,
          walkFrame,
          floorLevel
        });
        
        // Check if animation is complete
        if (newX > gameWidth + 100) {
          setIsAnimating(false);
          if (onComplete) onComplete();
          return prev;
        }
        
        return { ...prev, x: newX };
      });
      
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameWidth, isAnimating, onComplete, floorLevel]);

  if (position.x < -80 || position.x > gameWidth + 80) {
    return null;
  }

  return (
    <div
      className="sheila-character"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        bottom: `${floorLevel}px`,
        width: '60px',
        height: '75px',
        backgroundImage: `url('/images/Sheila.png')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        zIndex: 10,
        transform: 'scaleX(1)' // Facing right
      }}
    />
  );
};

export default SheilaAnimation;
