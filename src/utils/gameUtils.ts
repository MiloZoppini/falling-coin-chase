
import { FallingObject, PowerUpObject, CoinObject, ObstacleObject, GAME_LEVELS } from "../types/game";

export const createFallingObject = (
  gameWidth: number,
  currentLevel: number
): FallingObject => {
  if (!gameWidth) return {} as FallingObject;

  const id = Date.now() + Math.random();
  const width = 30;
  const x = Math.random() * (gameWidth - width);
  const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
  
  const isCoin = Math.random() > levelSettings.obstacleRate;
  const speed = levelSettings.speed * (1 + Math.random() * 0.5);

  return {
    id,
    x,
    y: -30,
    width,
    height: 30,
    speed,
    type: isCoin ? 'coin' : 'obstacle'
  };
};

export const createPowerUp = (
  gameWidth: number,
  currentLevel: number
): PowerUpObject => {
  if (!gameWidth) return {} as PowerUpObject;
  
  const id = Date.now() + Math.random();
  const width = 40;
  const x = Math.random() * (gameWidth - width);
  const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
  const speed = levelSettings.speed * 0.8;

  const powerTypes: Array<PowerUpObject['powerType']> = [];
  
  if (Math.random() < 0.1) {
    powerTypes.push('extraLife');
  } else {
    powerTypes.push(Math.random() < 0.5 ? 'invincibility' : 'doublePoints');
  }
  
  const powerType = powerTypes[0];

  return {
    id,
    x,
    y: -30,
    width,
    height: 40,
    speed,
    type: 'powerup',
    powerType
  };
};

export const updateFallingObjects = (
  objects: FallingObject[],
  deltaTime: number,
  gameHeight: number
): FallingObject[] => {
  return objects
    .map(obj => ({
      ...obj,
      y: obj.y + obj.speed * deltaTime
    }))
    .filter(obj => obj.y < (gameHeight + obj.height));
};

export const checkCollision = (
  obj1: { left: number; top: number; right: number; bottom: number },
  obj2: { left: number; top: number; right: number; bottom: number }
): boolean => {
  return (
    obj1.left < obj2.right &&
    obj1.right > obj2.left &&
    obj1.top < obj2.bottom &&
    obj1.bottom > obj2.top
  );
};
