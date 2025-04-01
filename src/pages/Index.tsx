
import { useEffect } from 'react';
import Game from '@/components/Game';

const Index = () => {
  useEffect(() => {
    // Preload Sheila image
    const preloadImage = new Image();
    preloadImage.src = '/images/Sheila.png';
  }, []);

  return <Game />;
};

export default Index;
