
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
  // Setting Sheila and hammer at the bottom of the screen (same level as Martin)
  const floorLevel = gameHeight - 180; // Position near the bottom where Martin walks
  
  const [position, setPosition] = useState<{ x: number; y: number }>({ 
    x: -100, // Start off-screen to the left
    y: floorLevel // At floor level
  });
  const [hammerPosition, setHammerPosition] = useState<{ x: number; y: number }>({ 
    x: -170, // Position hammer a bit behind Sheila
    y: floorLevel // Same height as Sheila
  });
  const [opacity, setOpacity] = useState(1);
  const [isAnimating, setIsAnimating] = useState(true);
  const [walkFrame, setWalkFrame] = useState(0); // For walking animation

  useEffect(() => {
    if (!isAnimating) return;

    // Console log to debug
    console.log("Starting Sheila animation", { gameWidth, gameHeight, floorLevel });

    const animationDuration = 6000; // 6 seconds to cross the screen (slowed down)
    const fadeOutDuration = 500; // 0.5 seconds
    const startTime = Date.now();
    
    // For walking animation
    const walkInterval = setInterval(() => {
      setWalkFrame(prev => (prev + 1) % 2); // Toggle between 0 and 1
    }, 200); // Change frame every 200ms
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Calculate positions based on animation progress
      if (progress < 0.9) {
        // Move from left to right
        const newX = -100 + (gameWidth + 200) * progress;
        const hammerX = -170 + (gameWidth + 200) * progress;
        
        setPosition({ x: newX, y: floorLevel + (walkFrame * 4) }); // Add slight up/down motion
        setHammerPosition({ x: hammerX, y: floorLevel + (walkFrame * 4) });
        setOpacity(1);
        
        // Debug log during animation
        if (elapsed % 1000 === 0) { // Log every second to avoid flooding console
          console.log("Sheila animation in progress", { 
            progress, 
            newX, 
            hammerX, 
            gameWidth,
            walkFrame,
            floorLevel
          });
        }
      } else {
        // Fade out
        const fadeProgress = (progress - 0.9) / 0.1;
        setOpacity(1 - fadeProgress);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        clearInterval(walkInterval);
        onAnimationComplete();
        console.log("Sheila animation completed");
      }
    };
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(walkInterval);
    };
  }, [gameWidth, gameHeight, isAnimating, onAnimationComplete, floorLevel, walkFrame]);

  if (!isAnimating && opacity <= 0) return null;

  return (
    <>
      <div
        className="hammer-animation"
        style={{
          position: 'absolute',
          left: `${hammerPosition.x}px`,
          top: `${hammerPosition.y}px`,
          width: '70px',
          height: '70px',
          backgroundImage: `url('/images/martello.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity,
          zIndex: 1000, // Higher zIndex to ensure it appears in front
          transform: 'rotate(10deg)' // Slightly rotate the hammer for a dynamic look
        }}
      />
      <div
        className={`sheila-animation ${walkFrame === 1 ? 'walk-frame' : ''}`}
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '120px',
          height: '140px',
          backgroundImage: `url('/images/Sheila.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity,
          zIndex: 1000, // Higher zIndex to ensure it appears in front
          animation: walkFrame === 1 ? 'sheila-step 0.2s ease-in-out' : 'none'
        }}
      />

      {/* Add dynamic CSS for walking animation */}
      <style>
        {`
        @keyframes sheila-step {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        `}
      </style>
    </>
  );
};

export default SheilaAnimation;
