
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw } from "lucide-react";

interface GameOverProps {
  isGameOver: boolean;
  score: number;
  resetGame: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ isGameOver, score, resetGame }) => {
  if (!isGameOver) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-fade-in">
      <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 shadow-lg border border-border flex flex-col items-center text-center">
        <Trophy className="text-yellow-500 w-16 h-16 mb-4" />
        <h2 className="text-4xl font-bold mb-2">Game Over!</h2>
        <p className="text-xl font-semibold mb-6">
          Final Score: <span className="text-primary">{score}</span>
        </p>
        <Button 
          onClick={resetGame} 
          className="px-6 py-6 text-lg bg-primary hover:bg-primary/90 flex items-center gap-2 w-full"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </Button>
      </div>
    </div>
  );
};

export default GameOver;
