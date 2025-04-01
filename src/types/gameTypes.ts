
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
  coinType: 'bitcoin' | 'moneycash' | 'saccosoldi';
  pointValue: number;
}

export interface ObstacleObject extends GameObject {
  type: 'obstacle';
}

export interface PowerUpObject extends GameObject {
  type: 'powerup';
  powerType: 'invincibility';
}

export interface HeartObject extends GameObject {
  type: 'heart';
}

export interface VodkaObject extends GameObject {
  type: 'vodka';
}

export interface PoopObject extends GameObject {
  type: 'poop';
  createdAt: number;
  onGround: boolean;
}

export interface SheilaObject {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface HammerObject {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export type FallingObject = CoinObject | ObstacleObject | PowerUpObject | HeartObject | VodkaObject | PoopObject;

export interface GameLevel {
  speed: number;
  spawnRate: number;
  obstacleRate: number;
  powerUpChance: number;
  heartChance: number;
  vodkaChance: number;
  poopChance: number;
}

export interface CoinType {
  imagePath: string;
  pointValue: number;
  width: number;
  height: number;
  probability: number;
}
