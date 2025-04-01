
import { GameLevel, CoinType } from '@/types/gameTypes';

export const GAME_LEVELS: Record<number, GameLevel> = {
  1: { speed: 0.2, spawnRate: 0.02, obstacleRate: 0.3, powerUpChance: 0.02, heartChance: 0.15, vodkaChance: 0.02, poopChance: 0.8 },
  2: { speed: 0.3, spawnRate: 0.03, obstacleRate: 0.4, powerUpChance: 0.015, heartChance: 0.15, vodkaChance: 0.025, poopChance: 0.8 },
  3: { speed: 0.4, spawnRate: 0.04, obstacleRate: 0.5, powerUpChance: 0.01, heartChance: 0.15, vodkaChance: 0.03, poopChance: 0.8 }
};

export const COIN_TYPES: Record<string, CoinType> = {
  bitcoin: { imagePath: '/images/bitcoin.png', pointValue: 500, width: 30, height: 30, probability: 0.4 },
  moneycash: { imagePath: '/images/moneycash.png', pointValue: 100, width: 36, height: 24, probability: 0.35 },
  saccosoldi: { imagePath: '/images/saccosoldi.png', pointValue: 200, width: 36, height: 36, probability: 0.25 }
};

export const POOP_POINT_VALUE = 150;
export const POOP_WIDTH = 29 * 0.8;
export const POOP_HEIGHT = 29 * 0.8;
export const AUTO_POOP_INTERVAL = 10000;
export const SHEILA_ENTRANCE_DELAY = 20000;
