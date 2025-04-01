
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
      </div>
    </div>
  );
};

export default PlayerNameModal;
