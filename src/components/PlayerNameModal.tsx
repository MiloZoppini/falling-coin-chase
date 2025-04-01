
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HighScore } from '@/services/supabaseService';
import { Loader } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface PlayerNameModalProps {
  onSubmit: (playerName: string) => void;
}

// List of all game assets to preload
const ASSETS_TO_PRELOAD = [
  '/images/Background.webp',
  '/images/Martin.png',
  '/images/MuscleMartin.png',
  '/images/Dog.png',
  '/images/martin_vodka.png',
  '/images/bitcoin.png',
  '/images/moneycash.png',
  '/images/saccosoldi.png',
  '/images/heart.png',
  '/images/lemon.webp',
  '/images/vodka.webp',
  '/images/nuke.png',
  '/images/shit.png'
];

const PlayerNameModal: React.FC<PlayerNameModalProps> = ({
  onSubmit
}) => {
  const [playerName, setPlayerName] = useState('');
  const [assetsLoaded, setAssetsLoaded] = useState(0);
  const [totalAssets] = useState(ASSETS_TO_PRELOAD.length);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const preloadAssets = async () => {
      // Function to preload a single image
      const preloadImage = (src: string): Promise<void> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            setAssetsLoaded(prev => prev + 1);
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            setAssetsLoaded(prev => prev + 1);
            resolve();
          };
        });
      };
      
      // Preload all images in parallel
      const preloadPromises = ASSETS_TO_PRELOAD.map(preloadImage);
      
      try {
        await Promise.all(preloadPromises);
        setIsLoading(false);
      } catch (err) {
        console.error('Error preloading assets:', err);
        setIsLoading(false);
      }
    };
    
    preloadAssets();
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && !isLoading) {
      onSubmit(playerName.trim());
    }
  };
  
  const loadingProgress = Math.round((assetsLoaded / totalAssets) * 100);
  
  return <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-[#2D2D2D] p-6 rounded-md shadow-lg max-w-md w-full font-pixel border-4 border-[#505050] shadow-inner mx-[20px]">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#FFDD00] drop-shadow-[2px_2px_0px_#000]">PRINT MONEY WITH MARTIN</h2>
        
        {isLoading ? (
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Loader className="animate-spin text-[#FFDD00]" size={36} />
            </div>
            <p className="text-[#EEEEEE] mb-4">Caricamento risorse del gioco...</p>
            <Progress value={loadingProgress} className="h-3 bg-[#111111]" />
            <p className="text-[#EEEEEE] mt-2 text-sm">{loadingProgress}%</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-6">
              <label htmlFor="playerName" className="block text-lg mb-2 text-[#EEEEEE]">
                Enter Your Name:
              </label>
              <Input id="playerName" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your Name" className="w-full font-pixel bg-[#111111] border-2 border-[#555555] text-[#EEEEEE]" maxLength={15} autoFocus required />
            </div>
            
            <button type="submit" disabled={!playerName.trim()} className="w-full font-pixel py-3 px-4 bg-[#5B8731] hover:bg-[#70A340] border-b-4 border-[#3E5E20] hover:border-[#5B8731] text-white font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none active:border-b-0 active:border-t-4 active:mt-1 active:-mb-1">
              START GAME
            </button>
          </form>
        )}
      </div>
    </div>;
};

export default PlayerNameModal;
