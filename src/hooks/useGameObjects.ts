
import { useState, useRef } from 'react';
import { FallingObject, PowerUpObject, GAME_LEVELS } from '../types/gameTypes';

interface GameObjectsProps {
  gameWidth: number;
  gameHeight: number;
  currentLevel: number;
  score: number;
  lives: number;
  isInvincible: boolean;
  hasDoublePoints: boolean;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  handlePowerUp: (powerType: PowerUpObject['powerType']) => void;
}

export const useGameObjects = ({
  gameWidth,
  gameHeight,
  currentLevel,
  score,
  lives,
  isInvincible,
  hasDoublePoints,
  setScore,
  setLives,
  setIsGameOver,
  handlePowerUp
}: GameObjectsProps) => {
  const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
  const lastPowerUpTime = useRef<number>(0);
  
  const createFallingObject = () => {
    if (!gameWidth) return;

    const id = Date.now() + Math.random();
    const width = 30;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    
    const isCoin = Math.random() > levelSettings.obstacleRate;
    const speed = levelSettings.speed * (1 + Math.random() * 0.5);

    const newObject: FallingObject = {
      id,
      x,
      y: -30,
      width,
      height: 30,
      speed,
      type: isCoin ? 'coin' : 'obstacle'
    };

    setFallingObjects(prev => [...prev, newObject]);
  };

  const createPowerUp = () => {
    if (!gameWidth) return;
    
    const id = Date.now() + Math.random();
    const width = 30;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    const speed = levelSettings.speed * 0.8;

    // Weight the power-ups so extraLife is rarer
    const powerTypes: Array<PowerUpObject['powerType']> = [];
    
    // 10% chance for extra life
    if (Math.random() < 0.1) {
      powerTypes.push('extraLife');
    } else {
      // 50% chance for each of the other power-ups
      powerTypes.push(Math.random() < 0.5 ? 'invincibility' : 'doublePoints');
    }
    
    const powerType = powerTypes[0];

    const newPowerUp: PowerUpObject = {
      id,
      x,
      y: -30,
      width,
      height: 30,
      speed,
      type: 'powerup',
      powerType
    };
    
    setFallingObjects(prev => [...prev, newPowerUp]);
  };

  const updateFallingObjects = (deltaTime: number) => {
    setFallingObjects(prev => 
      prev
        .map(obj => ({
          ...obj,
          y: obj.y + obj.speed * deltaTime
        }))
        .filter(obj => obj.y < (gameHeight + obj.height))
    );
  };

  const checkCollisions = (playerRect: DOMRect) => {
    const playerX = playerRect.left;
    const playerY = playerRect.top;
    const playerWidth = playerRect.width;
    const playerHeight = playerRect.height;

    setFallingObjects(prev => {
      const remaining = [];
      let scoreIncrement = 0;
      let lostLife = false;
      let powerupCollected = false;
      let powerupType: PowerUpObject['powerType'] | null = null;

      for (const obj of prev) {
        const objectRect = {
          left: obj.x,
          top: obj.y,
          right: obj.x + obj.width,
          bottom: obj.y + obj.height
        };

        if (
          playerX < objectRect.right &&
          playerX + playerWidth > objectRect.left &&
          playerY < objectRect.bottom &&
          playerY + playerHeight > objectRect.top
        ) {
          if (obj.type === 'coin') {
            scoreIncrement += hasDoublePoints ? 2 : 1;
          } else if (obj.type === 'obstacle') {
            if (!isInvincible) {
              lostLife = true;
            }
          } else if (obj.type === 'powerup') {
            powerupCollected = true;
            powerupType = obj.powerType;
          }
        } else {
          remaining.push(obj);
        }
      }

      if (scoreIncrement > 0) {
        setScore(s => s + scoreIncrement * 100);
      }
      
      if (lostLife) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setIsGameOver(true);
          }
          return newLives;
        });
      }
      
      if (powerupCollected && powerupType) {
        handlePowerUp(powerupType);
      }

      return remaining;
    });
  };

  return {
    fallingObjects,
    setFallingObjects,
    createFallingObject,
    createPowerUp,
    updateFallingObjects,
    checkCollisions,
    lastPowerUpTime
  };
};
