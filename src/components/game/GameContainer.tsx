
import React, { useRef } from 'react';
import { FallingObject as FallingObjectType } from '@/types/gameTypes';
import FallingObject from './FallingObject';

interface GameContainerProps {
  gameContainerRef: React.RefObject<HTMLDivElement>;
  fallingObjects: FallingObjectType[];
  playerRef: React.RefObject<HTMLDivElement>;
  playerPosition: { x: number; y: number };
  isInvincible: boolean;
  hasDoublePoints: boolean;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  children: React.ReactNode;
}

const GameContainer: React.FC<GameContainerProps> = ({
  gameContainerRef,
  fallingObjects,
  playerRef,
  playerPosition,
  isInvincible,
  hasDoublePoints,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  children
}) => {
  return (
    <div 
      ref={gameContainerRef} 
      className="game-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        ref={playerRef} 
        className={`player ${isInvincible ? 'invincible' : ''} ${hasDoublePoints ? 'double-points' : ''}`}
        style={{ 
          left: `${playerPosition.x}px`,
          bottom: `100px`,
          backgroundImage: `url('/lovable-uploads/27f7581b-1726-4a1a-a66e-f4c0190d4bc5.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: '64px',
          height: '64px'
        }}
      ></div>
      
      {fallingObjects.map((obj) => (
        <FallingObject key={obj.id} object={obj} />
      ))}
      
      {children}
    </div>
  );
};

export default GameContainer;
