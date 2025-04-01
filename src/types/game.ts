
// Game objects interfaces
export interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface CoinObject extends GameObject {
  type: 'coin';
}

export interface ObstacleObject extends GameObject {
  type: 'obstacle';
}

export interface PowerUpObject extends GameObject {
  type: 'powerup';
  powerType: 'invincibility' | 'extraLife' | 'doublePoints';
}

export type FallingObject = CoinObject | ObstacleObject | PowerUpObject;

// Game levels
export const GAME_LEVELS = {
  1: { speed: 0.2, spawnRate: 0.02, obstacleRate: 0.3, powerUpChance: 0.02 },
  2: { speed: 0.3, spawnRate: 0.03, obstacleRate: 0.4, powerUpChance: 0.015 },
  3: { speed: 0.4, spawnRate: 0.04, obstacleRate: 0.5, powerUpChance: 0.01 }
};

export type PlayerPosition = {
  x: number;
  y: number;
};

export type DogPosition = {
  x: number;
  direction: 'left' | 'right';
};

export type Direction = 'left' | 'right';
