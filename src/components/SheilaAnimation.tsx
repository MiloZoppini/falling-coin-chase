
import React, { useEffect, useState } from 'react';

interface SheilaAnimationProps {
  gameWidth: number;
  gameHeight: number;
  onAnimationComplete: () => void;
}

const SheilaAnimation: React.FC<SheilaAnimationProps> = ({ 
  gameWidth, 
  gameHeight, 
  onAnimationComplete 
}) => {
  // Setting both Sheila and hammer to start at the same height, centered vertically in the game area
  const [position, setPosition] = useState<{ x: number; y: number }>({ 
    x: -100, 
    y: gameHeight / 2 - 40 // Centered vertically in game area
  });
  const [hammerPosition, setHammerPosition] = useState<{ x: number; y: number }>({ 
    x: -170, // Position hammer a bit behind Sheila
    y: gameHeight / 2 - 40 // Same height as Sheila
  });
  const [opacity, setOpacity] = useState(1);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;

    const animationDuration = 3000; // 3 seconds
    const fadeOutDuration = 500; // 0.5 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Calculate positions based on animation progress
      if (progress < 0.85) {
        // Move from left to right
        const newX = -100 + (gameWidth + 200) * progress;
        const hammerX = -170 + (gameWidth + 200) * progress;
        
        setPosition({ x: newX, y: gameHeight / 2 - 40 });
        setHammerPosition({ x: hammerX, y: gameHeight / 2 - 40 });
        setOpacity(1);
      } else {
        // Fade out
        const fadeProgress = (progress - 0.85) / 0.15;
        setOpacity(1 - fadeProgress);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        onAnimationComplete();
      }
    };
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameWidth, gameHeight, isAnimating, onAnimationComplete]);

  if (!isAnimating && opacity <= 0) return null;

  return (
    <>
      <div
        className="hammer-animation"
        style={{
          position: 'absolute',
          left: `${hammerPosition.x}px`,
          top: `${hammerPosition.y}px`,
          width: '80px', // Increased size
          height: '80px', // Increased size
          backgroundImage: `url('/images/martello.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity,
          zIndex: 25 // Higher zIndex to appear in front of player
        }}
      />
      <div
        className="sheila-animation"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '100px', // Increased size
          height: '100px', // Increased size
          backgroundImage: `url('/images/Sheila.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity,
          zIndex: 25 // Higher zIndex to appear in front of player
        }}
      />
    </>
  );
};

export default SheilaAnimation;
