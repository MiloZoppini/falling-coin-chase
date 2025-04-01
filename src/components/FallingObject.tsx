
import React from 'react';
import { FallingObject as FallingObjectType } from '../types/game';

interface FallingObjectProps {
  object: FallingObjectType;
}

const FallingObject: React.FC<FallingObjectProps> = ({ object }) => {
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
        borderRadius: object.type === 'coin' ? '50%' : object.type === 'powerup' ? '0' : '0px',
        backgroundImage: object.type === 'powerup' ? `url('/images/lemon.webp')` : 'none',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    ></div>
  );
};

export default FallingObject;
