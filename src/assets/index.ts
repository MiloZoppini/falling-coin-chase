
// This file exports all game assets for easy importing

// Player image
import playerImg from './player.png';

// Game objects
import coinImg from './coin.png';
import obstacleImg from './obstacle.png';

// Powerups
import invincibilityImg from './invincibility.png';
import extraLifeImg from './extraLife.png';
import doublePointsImg from './doublePoints.png';

export const images = {
  player: playerImg,
  coin: coinImg,
  obstacle: obstacleImg,
  powerups: {
    invincibility: invincibilityImg,
    extraLife: extraLifeImg,
    doublePoints: doublePointsImg
  }
};

export default images;
