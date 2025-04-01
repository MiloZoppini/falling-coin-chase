
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Medal } from 'lucide-react';
import { HighScore } from '@/services/supabaseService';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GameOverProps {
  isGameOver: boolean;
  playerName: string;
  score: number;
  highScores: HighScore[];
  onPlayAgain: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
  isGameOver,
  playerName,
  score,
  highScores,
  onPlayAgain
}) => {
  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0: return "gold";
      case 1: return "silver";
      case 2: return "#CD7F32";
      default: return "currentColor";
    }
  };

  return (
    <div className={`game-over ${isGameOver ? '' : 'hidden'}`}>
      <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
      <p className="text-xl mb-2">Player: {playerName}</p>
      <p className="text-xl mb-6">Final Score: {score}</p>
      
      {highScores.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Trophy size={20} />
            <h3 className="text-xl font-bold">Leaderboard</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="w-12">Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell className="text-right">Score</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highScores.slice(0, 3).map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center">
                      <Medal size={18} color={getMedalColor(index)} fill={getMedalColor(index)} />
                    </div>
                  </TableCell>
                  <TableCell>{entry.playerName}</TableCell>
                  <TableCell className="text-right">{entry.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <Button onClick={onPlayAgain} className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
        Play Again
      </Button>
    </div>
  );
};

export default GameOver;
