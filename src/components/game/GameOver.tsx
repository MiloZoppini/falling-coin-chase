
import React from 'react';
import { Button } from "@/components/ui/button";

interface GameOverProps {
  isGameOver: boolean;
  score: number;
  resetGame: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ isGameOver, score, resetGame }) => {
  return (
    <div className={`game-over ${isGameOver ? '' : 'hidden'}`}>
      <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
      <p className="text-xl mb-6">Final Score: {score}</p>
      <Button onClick={resetGame} className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
        Play Again
      </Button>
    </div>
  );
};

export default GameOver;
