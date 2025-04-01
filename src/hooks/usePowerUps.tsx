
import { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { PowerUpObject } from '../types/game';

export const usePowerUps = () => {
  const { toast } = useToast();
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [hasDoublePoints, setHasDoublePoints] = useState<boolean>(false);
  const [isMuscleMartin, setIsMuscleMartin] = useState<boolean>(false);
  const [cameraShake, setCameraShake] = useState<boolean>(false);
  const invincibilityTimeoutRef = useRef<number | null>(null);
  const doublePointsTimeoutRef = useRef<number | null>(null);
  const lastPowerUpTime = useRef<number>(0);

  const handlePowerUp = (powerType: PowerUpObject['powerType']) => {
    switch (powerType) {
      case 'invincibility':
        setIsInvincible(true);
        setIsMuscleMartin(true);
        setCameraShake(true);
        
        toast({
          title: "Lemon Power!",
          description: "You transformed into Muscle Martin! Invincible for 5 seconds!",
        });
        
        if (invincibilityTimeoutRef.current) {
          clearTimeout(invincibilityTimeoutRef.current);
        }
        
        const shakeInterval = setInterval(() => {
          setCameraShake(shake => !shake);
        }, 100);
        
        invincibilityTimeoutRef.current = window.setTimeout(() => {
          setIsInvincible(false);
          setIsMuscleMartin(false);
          setCameraShake(false);
          clearInterval(shakeInterval);
          
          toast({
            title: "Power ended!",
            description: "You transformed back to normal!",
          });
        }, 5000);
        break;
        
      case 'extraLife':
        return (prevLives: number) => {
          const newLives = Math.min(5, prevLives + 1);
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
    hasDoublePoints,
    isMuscleMartin,
    cameraShake,
    lastPowerUpTime,
    handlePowerUp,
    cleanupPowerUps,
    resetPowerUps: () => {
      setIsInvincible(false);
      setHasDoublePoints(false);
      setIsMuscleMartin(false);
      setCameraShake(false);
      lastPowerUpTime.current = 0;
      cleanupPowerUps();
    }
  };
};
