
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HighScore, getHighScores } from '@/services/supabaseService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Medal } from 'lucide-react';

interface PlayerNameModalProps {
  onSubmit: (playerName: string) => void;
}

const PlayerNameModal: React.FC<PlayerNameModalProps> = ({ onSubmit }) => {
  const [playerName, setPlayerName] = useState('');
  const [highScores, setHighScores] = useState<HighScore[]>([]);

  useEffect(() => {
    const loadHighScores = async () => {
      const scores = await getHighScores();
      setHighScores(scores);
    };
    
    loadHighScores();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onSubmit(playerName.trim());
    }
  };

  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0: return "gold";
      case 1: return "silver";
      case 2: return "#CD7F32";
      default: return "currentColor";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-[#2D2D2D] p-6 rounded-md shadow-lg max-w-md w-full font-pixel border-4 border-[#505050] shadow-inner">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#FFDD00] drop-shadow-[2px_2px_0px_#000]">PRINT MONEY WITH MARTIN</h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-lg mb-2 text-[#EEEEEE]">
              Enter Your Name:
            </label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your Name"
              className="w-full font-pixel bg-[#111111] border-2 border-[#555555] text-[#EEEEEE]"
              maxLength={15}
              autoFocus
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={!playerName.trim()}
            className="w-full font-pixel py-3 px-4 bg-[#5B8731] hover:bg-[#70A340] border-b-4 border-[#3E5E20] hover:border-[#5B8731] text-white font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none active:border-b-0 active:border-t-4 active:mt-1 active:-mb-1"
          >
            START GAME
          </button>
        </form>

        {highScores.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Trophy size={20} />
              <h3 className="text-xl font-bold text-[#EEEEEE]">Leaderboard</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-[#EEEEEE]">Rank</TableHead>
                  <TableHead className="text-[#EEEEEE]">Player</TableHead>
                  <TableHead className="text-right text-[#EEEEEE]">Score</TableHead>
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
                    <TableCell className="text-[#EEEEEE]">{entry.playerName}</TableCell>
                    <TableCell className="text-right text-[#EEEEEE]">{entry.score}</TableCell>
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
