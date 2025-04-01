
import React from 'react';
import { FallingObject as FallingObjectType } from '@/types/gameTypes';

interface FallingObjectProps {
  object: FallingObjectType;
}

const FallingObject: React.FC<FallingObjectProps> = ({ object }) => {
  return (
    <div
      className={
        object.type === 'coin' 
          ? 'coin' 
          : object.type === 'obstacle' 
            ? 'obstacle' 
            : `powerup powerup-${object.powerType}`
      }
      style={{
        left: `${object.x}px`,
        top: `${object.y}px`,
        width: `${object.width}px`,
        height: `${object.height}px`,
        borderRadius: object.type === 'coin' || object.type === 'powerup' ? '50%' : '0px'
      }}
    />
  );
};

export default FallingObject;
