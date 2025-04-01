
import React from 'react';

interface PlayerProps {
  position: { x: number; y: number };
  isInvincible: boolean;
  isVodkaActive: boolean;
  isWalking: boolean;
  isHurt: boolean;
  isEjecting: boolean;
  areControlsReversed: boolean;
  direction: 'left' | 'right';
}

const Player: React.FC<PlayerProps> = ({
  position,
  isInvincible,
  isVodkaActive,
  isWalking,
  isHurt,
  isEjecting,
  areControlsReversed,
  direction
}) => {
  return (
    <div 
      className={`player ${isInvincible ? 'invincible' : ''} ${isWalking ? 'walking' : ''} ${isHurt ? 'hurt' : ''} ${isEjecting ? 'ejecting' : ''} ${areControlsReversed ? 'drunk' : ''}`}
      style={{ 
        left: `${position.x}px`,
        bottom: `100px`,
        backgroundImage: isInvincible
          ? `url('/images/MuscleMartin.png')`
          : isVodkaActive 
            ? `url('/images/martin_vodka.png')`
            : `url('/images/Martin.png')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        transition: 'transform 0.2s ease-out',
        width: isInvincible ? '108px' : '72px',
        height: '72px',
        zIndex: 2
      }}
    ></div>
  );
};

export default Player;
