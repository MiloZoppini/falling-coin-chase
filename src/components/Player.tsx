
import React from 'react';
import { PlayerPosition, Direction } from '../types/game';

interface PlayerProps {
  position: PlayerPosition;
  direction: Direction;
  isWalking: boolean;
  isInvincible: boolean;
  hasDoublePoints: boolean;
  isMuscleMartin: boolean;
}

const Player: React.FC<PlayerProps> = ({
  position,
  direction,
  isWalking,
  isInvincible,
  hasDoublePoints,
  isMuscleMartin
}) => {
  return (
    <div 
      className={`player ${isInvincible ? 'invincible' : ''} ${hasDoublePoints ? 'double-points' : ''} ${isWalking ? 'walking' : ''} ${isMuscleMartin ? 'muscle-martin' : ''}`}
      style={{ 
        left: `${position.x}px`,
        bottom: `100px`,
        backgroundImage: isMuscleMartin ? `url('/images/MuscleMartin.png')` : `url('/images/Martin.png')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        transition: 'transform 0.2s ease-out',
        width: '72px',
        height: '72px'
      }}
    ></div>
  );
};

export default Player;
