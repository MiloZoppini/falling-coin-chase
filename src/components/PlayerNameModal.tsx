
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HighScore } from '@/services/supabaseService';

interface PlayerNameModalProps {
  onSubmit: (playerName: string) => void;
}

const PlayerNameModal: React.FC<PlayerNameModalProps> = ({ onSubmit }) => {
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
        <h2 className="text-2xl font-bold mb-4 text-center">PRINT MONEY WITH MARTIN</h2>
        
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
      </div>
    </div>
  );
};

export default PlayerNameModal;
