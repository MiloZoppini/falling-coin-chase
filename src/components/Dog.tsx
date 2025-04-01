
import React from 'react';
import { DogPosition } from '../types/game';

interface DogProps {
  position: DogPosition;
  isWalking: boolean;
}

const Dog: React.FC<DogProps> = ({ position, isWalking }) => {
  return (
    <div 
      className={`dog ${isWalking ? 'walking' : ''}`}
      style={{ 
        left: `${position.x}px`,
        bottom: `100px`,
        backgroundImage: `url('/images/Dog.png')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        transform: position.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        width: '40px',
        height: '40px'
      }}
    ></div>
  );
};

export default Dog;
