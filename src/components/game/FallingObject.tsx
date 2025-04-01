
import React from 'react';
import { FallingObject as FallingObjectType, CoinObject, PowerUpObject } from '@/types/gameTypes';
import { COIN_TYPES } from '@/constants/gameConstants';

interface FallingObjectProps {
  object: FallingObjectType;
}

const FallingObject: React.FC<FallingObjectProps> = ({ object }) => {
  const getBackgroundImage = () => {
    switch (object.type) {
      case 'coin':
        return `url('${COIN_TYPES[(object as CoinObject).coinType].imagePath}')`;
      case 'powerup':
        return `url('/images/lemon.webp')`;
      case 'heart':
        return `url('/images/heart.png')`;
      case 'vodka':
        return `url('/images/vodka.webp')`;
      case 'poop':
        return `url('/images/shit.png')`;
      case 'obstacle':
        return `url('/images/nuke.png')`;
      default:
        return '';
    }
  };

  const getClassName = () => {
    if (object.type === 'coin') {
      return `coin coin-${(object as CoinObject).coinType}`;
    } else if (object.type === 'obstacle') {
      return 'obstacle';
    } else if (object.type === 'heart') {
      return 'heart pulsing-heart';
    } else if (object.type === 'vodka') {
      return 'vodka';
    } else if (object.type === 'poop') {
      return 'poop';
    } else {
      return `powerup powerup-${(object as PowerUpObject).powerType}`;
    }
  };

  return (
    <div
      className={getClassName()}
      style={{
        left: `${object.x}px`,
        top: `${object.y}px`,
        width: `${object.width}px`,
        height: `${object.height}px`,
        backgroundColor: 'transparent',
        backgroundImage: getBackgroundImage(),
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        zIndex: 2
      }}
    ></div>
  );
};

export default FallingObject;
