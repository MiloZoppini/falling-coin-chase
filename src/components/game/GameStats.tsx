
import React from 'react';
import { Coins, Heart, Star } from 'lucide-react';

interface GameStatsProps {
  score: number;
  currentLevel: number;
  lives: number;
  isInvincible: boolean;
  hasDoublePoints: boolean;
}

const GameStats: React.FC<GameStatsProps> = ({ 
  score, 
  currentLevel, 
  lives, 
  isInvincible, 
  hasDoublePoints 
}) => {
  return (
    <div className="game-stats">
      <div className="flex items-center mb-2">
        <Coins className="mr-2" size={20} color="gold" />
        <span>{score}</span>
      </div>
      <div className="flex items-center mb-2">
        <span className="mr-2">Level: {currentLevel}</span>
      </div>
      <div className="flex items-center">
        {Array.from({ length: lives }).map((_, i) => (
          <Heart key={i} size={20} color="red" fill="red" className="mr-1" />
        ))}
      </div>
      <div className="flex items-center mt-2">
        {isInvincible && (
          <div className="flex items-center mr-2 text-yellow-400">
            <Star size={16} className="mr-1" />
            <span>Invincible</span>
          </div>
        )}
        {hasDoublePoints && (
          <div className="flex items-center text-green-400">
            <Coins size={16} className="mr-1" />
            <span>2x Points</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStats;
