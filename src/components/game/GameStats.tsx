
import React from 'react';
import { Coins, Star } from 'lucide-react';

interface GameStatsProps {
  score: number;
  currentLevel: number;
  lives: number;
  isInvincible: boolean;
  invincibilityTimeLeft: number;
  areControlsReversed: boolean;
  controlsReversedTimeLeft: number;
  playerName: string;
}

const GameStats: React.FC<GameStatsProps> = ({
  score,
  currentLevel,
  lives,
  isInvincible,
  invincibilityTimeLeft,
  areControlsReversed,
  controlsReversedTimeLeft,
  playerName
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
          <img 
            key={i} 
            src="/images/heart.png" 
            alt="Heart" 
            className="mr-1" 
            style={{ width: '20px', height: '20px' }} 
          />
        ))}
      </div>
      
      {isInvincible && (
        <div className="mt-2 w-full">
          <div className="flex items-center text-yellow-400 mb-1">
            <Star size={16} className="mr-1" />
            <span>Invincible: {Math.ceil(invincibilityTimeLeft)}s</span>
          </div>
        </div>
      )}
      
      {areControlsReversed && (
        <div className="mt-2 w-full">
          <div className="flex items-center text-red-400 mb-1">
            <span>Controls reversed: {Math.ceil(controlsReversedTimeLeft)}s</span>
          </div>
        </div>
      )}
      
      <div className="player-name mt-2">
        <span>{playerName}</span>
      </div>
    </div>
  );
};

export default GameStats;
