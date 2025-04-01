
// This file exports all game assets for easy importing

// We'll use simple colored rectangles as placeholders instead of actual images
// until the real images are available

const createPlaceholderDataURL = (color: string) => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40' fill='${encodeURIComponent(color)}'%3E%3Crect width='40' height='40' rx='20' /%3E%3C/svg%3E`;
};

// Generate placeholder images with different colors
const playerImg = createPlaceholderDataURL('#3498db');
const coinImg = createPlaceholderDataURL('#f1c40f');
const obstacleImg = createPlaceholderDataURL('#e74c3c');
const invincibilityImg = createPlaceholderDataURL('#9b59b6');
const extraLifeImg = createPlaceholderDataURL('#e74c3c');
const doublePointsImg = createPlaceholderDataURL('#2ecc71');

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
