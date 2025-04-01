
import React, { useState, useEffect } from 'react';
import Game from '@/components/Game';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Preload Sheila's image
    const sheilaImage = new Image();
    sheilaImage.src = '/images/Sheila.png';
    
    // Small delay to ensure all assets are loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full">
      {isLoading ? (
        <div className="w-full h-screen flex items-center justify-center bg-black">
          <img 
            src="/images/Sheila.png" 
            alt="Loading" 
            className="w-32 h-32 animate-pulse"
          />
        </div>
      ) : (
        <Game />
      )}
    </div>
  );
};

export default Index;
