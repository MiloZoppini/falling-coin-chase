
import { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { PowerUpObject } from '../types/gameTypes';

export const usePowerUps = () => {
  const { toast } = useToast();
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [hasDoublePoints, setHasDoublePoints] = useState<boolean>(false);
  const invincibilityTimeoutRef = useRef<number | null>(null);
  const doublePointsTimeoutRef = useRef<number | null>(null);

  const handlePowerUp = (powerType: PowerUpObject['powerType']) => {
    switch (powerType) {
      case 'invincibility':
        setIsInvincible(true);
        toast({
          title: "Invincibility!",
          description: "You are invincible for 5 seconds!",
        });
        
        if (invincibilityTimeoutRef.current) {
          clearTimeout(invincibilityTimeoutRef.current);
        }
        
        invincibilityTimeoutRef.current = window.setTimeout(() => {
          setIsInvincible(false);
          toast({
            title: "Invincibility ended!",
            description: "Be careful now!",
          });
        }, 5000);
        break;
        
      case 'extraLife':
        return (currentLives: number) => {
          // Cap maximum lives at 5
          const newLives = Math.min(5, currentLives + 1);
          toast({
            title: "Extra Life!",
            description: `You now have ${newLives} lives!`,
          });
          return newLives;
        };
        
      case 'doublePoints':
        setHasDoublePoints(true);
        toast({
          title: "Double Points!",
          description: "Points are doubled for 8 seconds!",
        });
        
        if (doublePointsTimeoutRef.current) {
          clearTimeout(doublePointsTimeoutRef.current);
        }
        
        // Double points duration
        doublePointsTimeoutRef.current = window.setTimeout(() => {
          setHasDoublePoints(false);
          toast({
            title: "Double Points ended!",
            description: "Back to normal points.",
          });
        }, 8000);
        break;
    }
  };

  const cleanupPowerUps = () => {
    if (invincibilityTimeoutRef.current) {
      clearTimeout(invincibilityTimeoutRef.current);
    }
    
    if (doublePointsTimeoutRef.current) {
      clearTimeout(doublePointsTimeoutRef.current);
    }
  };

  return {
    isInvincible,
    setIsInvincible,
    hasDoublePoints,
    setHasDoublePoints,
    handlePowerUp,
    cleanupPowerUps
  };
};
