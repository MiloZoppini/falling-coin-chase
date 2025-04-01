
import React from 'react';
import { FallingObject as FallingObjectType } from '../types/game';

interface FallingObjectProps {
  object: FallingObjectType;
}

const FallingObject: React.FC<FallingObjectProps> = ({ object }) => {
  const getImageForPowerUp = () => {
    return '/images/lemon.webp';
  };

  const className = object.type === 'coin' 
    ? 'coin' 
    : object.type === 'obstacle' 
      ? 'obstacle' 
      : `powerup powerup-${object.powerType}`;

  return (
    <div
      className={className}
      style={{
        left: `${object.x}px`,
        top: `${object.y}px`,
        width: `${object.width}px`,
        height: `${object.height}px`,
        borderRadius: object.type === 'coin' ? '50%' : object.type === 'powerup' ? '8px' : '0px',
        backgroundImage: object.type === 'powerup' ? `url('${getImageForPowerUp()}')` : 'none',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: object.type === 'powerup' ? '0 0 15px 5px rgba(255, 255, 0, 0.7)' : 'none',
      }}
    ></div>
  );
};

export default FallingObject;
