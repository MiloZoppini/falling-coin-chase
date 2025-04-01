
import React, { useState, useEffect } from 'react';
import Game from '@/components/Game';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
          <div className="w-32 h-32 animate-pulse bg-gray-700 rounded-full flex items-center justify-center text-white">
            Loading...
          </div>
        </div>
      ) : (
        <Game />
      )}
    </div>
  );
};

export default Index;
