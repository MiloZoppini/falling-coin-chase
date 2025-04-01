
import React from 'react';

interface DogProps {
  position: { x: number; direction: 'left' | 'right' };
  isWalking: boolean;
  isEjecting: boolean;
}

const Dog: React.FC<DogProps> = ({ position, isWalking, isEjecting }) => {
  return (
    <div 
      className={`dog ${isWalking ? 'walking' : ''} ${isEjecting ? 'ejecting' : ''}`}
      style={{ 
        left: `${position.x}px`,
        bottom: `100px`,
        backgroundImage: `url('/images/Dog.png')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        transform: position.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        width: '40px',
        height: '40px',
        zIndex: 2
      }}
    ></div>
  );
};

export default Dog;
