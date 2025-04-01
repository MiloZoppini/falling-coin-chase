
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
  // Setting both Sheila and hammer to start at the same height, at player level
  const [position, setPosition] = useState<{ x: number; y: number }>({ 
    x: 0, // Start from the very left edge (visible)
    y: gameHeight / 2 - 40 // Centered vertically in game area
  });
  const [hammerPosition, setHammerPosition] = useState<{ x: number; y: number }>({ 
    x: -70, // Position hammer a bit behind Sheila
    y: gameHeight / 2 - 40 // Same height as Sheila
  });
  const [opacity, setOpacity] = useState(1);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;

    // Console log to debug
    console.log("Starting Sheila animation", { gameWidth, gameHeight });

    const animationDuration = 3000; // 3 seconds
    const fadeOutDuration = 500; // 0.5 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Calculate positions based on animation progress
      if (progress < 0.85) {
        // Move from left to right
        const newX = 0 + (gameWidth + 100) * progress;
        const hammerX = -70 + (gameWidth + 100) * progress;
        
        setPosition({ x: newX, y: gameHeight / 2 - 40 });
        setHammerPosition({ x: hammerX, y: gameHeight / 2 - 40 });
        setOpacity(1);
        
        // Debug log during animation
        if (elapsed % 500 === 0) { // Log every 500ms to avoid flooding console
          console.log("Sheila animation in progress", { 
            progress, 
            newX, 
            hammerX, 
            gameWidth 
          });
        }
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
        console.log("Sheila animation completed");
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
          width: '80px',
          height: '80px',
          backgroundImage: `url('/images/martello.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity,
          zIndex: 100 // Much higher zIndex to ensure it appears in front
        }}
      />
      <div
        className="sheila-animation"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '100px',
          height: '100px',
          backgroundImage: `url('/images/Sheila.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity,
          zIndex: 100 // Much higher zIndex to ensure it appears in front
        }}
      />
    </>
  );
};

export default SheilaAnimation;
