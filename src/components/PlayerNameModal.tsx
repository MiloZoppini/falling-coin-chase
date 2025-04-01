
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Medal } from 'lucide-react';
import { HighScore } from '@/services/supabaseService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlayerNameModalProps {
  onSubmit: (playerName: string) => void;
  highScores: HighScore[];
}

const PlayerNameModal: React.FC<PlayerNameModalProps> = ({ onSubmit, highScores }) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onSubmit(playerName.trim());
    }
  };

  // Get only top 3 scores
  const topThreeScores = highScores.slice(0, 3);

  // Medal colors for top positions
  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0: return "gold";
      case 1: return "silver";
      case 2: return "#CD7F32"; // bronze
      default: return "currentColor";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full font-pixel">
        <h2 className="text-2xl font-bold mb-4 text-center">Falling Coin Chase</h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-lg mb-2">
              Enter Your Name:
            </label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your Name"
              className="w-full font-pixel"
              maxLength={15}
              autoFocus
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={!playerName.trim()} 
            className="w-full font-pixel"
          >
            Start Game
          </Button>
        </form>
        
        {topThreeScores.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={20} />
              <h3 className="text-xl font-bold">Leaderboard</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topThreeScores.map((entry, index) => (
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
      </div>
    </div>
  );
};

export default PlayerNameModal;
