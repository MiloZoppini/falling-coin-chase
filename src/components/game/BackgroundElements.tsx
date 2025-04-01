
import React from 'react';
import { SheilaObject, HammerObject } from '@/types/gameTypes';

interface BackgroundElementsProps {
  sheila: SheilaObject;
  hammer: HammerObject;
}

const BackgroundElements: React.FC<BackgroundElementsProps> = ({ sheila, hammer }) => {
  return (
    <>
      {sheila.visible && (
        <div 
          className="sheila"
          style={{ 
            position: 'absolute',
            left: `${sheila.x}px`,
            top: `${sheila.y}px`,
            width: `${sheila.width}px`,
            height: `${sheila.height}px`,
            backgroundImage: `url('/images/Sheila.png')`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            zIndex: 1
          }}
        />
      )}
      
      {hammer.visible && (
        <div 
          className="hammer"
          style={{ 
            position: 'absolute',
            left: `${hammer.x}px`,
            top: `${hammer.y}px`,
            width: `${hammer.width}px`,
            height: `${hammer.height}px`,
            backgroundImage: `url('/images/martello.png')`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            zIndex: 1
          }}
        />
      )}
    </>
  );
};

export default BackgroundElements;
