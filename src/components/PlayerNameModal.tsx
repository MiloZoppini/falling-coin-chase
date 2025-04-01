
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy } from 'lucide-react';

interface PlayerNameModalProps {
  onSubmit: (playerName: string) => void;
  highScores: { playerName: string; score: number }[];
}

const PlayerNameModal: React.FC<PlayerNameModalProps> = ({ onSubmit, highScores }) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onSubmit(playerName.trim());
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
        
        {highScores.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={20} />
              <h3 className="text-xl font-bold">High Scores</h3>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Player</th>
                    <th className="text-right py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {highScores.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2">{entry.playerName}</td>
                      <td className="text-right py-2">{entry.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerNameModal;
