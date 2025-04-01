
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { GAME_LEVELS, PowerUpObject } from '@/types/gameTypes';
import { usePlayerMovement } from '@/hooks/usePlayerMovement';
import { useGameObjects } from '@/hooks/useGameObjects';
import { usePowerUps } from '@/hooks/usePowerUps';
import GameStats from '@/components/game/GameStats';
import GameOver from '@/components/game/GameOver';
import MobileControls from '@/components/game/MobileControls';
import FallingObject from '@/components/game/FallingObject';

const Game: React.FC = () => {
  const { toast } = useToast();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  
  const [gameWidth, setGameWidth] = useState<number>(0);
  const [gameHeight, setGameHeight] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentLevel, setCurrentLevel] = useState<number>(1);

  // Custom hooks
  const {
    playerRef,
    playerPosition,
    setPlayerPosition,
    movePlayer,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    startMovingLeft,
    stopMovingLeft,
    startMovingRight,
    stopMovingRight
  } = usePlayerMovement({ gameWidth, isGameOver });

  const {
    isInvincible,
    hasDoublePoints,
    handlePowerUp: handlePowerUpEffect,
    cleanupPowerUps
  } = usePowerUps();

  // Handler for power-ups that affects lives
  const processPowerUp = (powerType: PowerUpObject['powerType']) => {
    if (powerType === 'extraLife') {
      setLives(l => {
        // Cap maximum lives at 5
        const newLives = Math.min(5, l + 1);
        toast({
          title: "Extra Life!",
          description: `You now have ${newLives} lives!`,
        });
        return newLives;
      });
    } else {
      handlePowerUpEffect(powerType);
    }
  };

  const {
    fallingObjects,
    setFallingObjects,
    createFallingObject,
    createPowerUp,
    updateFallingObjects,
    checkCollisions,
    lastPowerUpTime
  } = useGameObjects({
    gameWidth,
    gameHeight,
    currentLevel,
    score,
    lives,
    isInvincible,
    hasDoublePoints,
    setScore,
    setLives,
    setIsGameOver,
    handlePowerUp: processPowerUp
  });

  useEffect(() => {
    const handleResize = () => {
      if (gameContainerRef.current) {
        const { width, height } = gameContainerRef.current.getBoundingClientRect();
        setGameWidth(width);
        setGameHeight(height);
        
        if (playerRef.current) {
          const playerWidth = playerRef.current.offsetWidth;
          setPlayerPosition({
            x: width / 2 - playerWidth / 2,
            y: height - 100
          });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    toast({
      title: "Game Started!",
      description: "Catch the coins and avoid the obstacles!",
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      cleanupPowerUps();
    };
  }, [toast, playerRef, setPlayerPosition, cleanupPowerUps]);

  useEffect(() => {
    if (isGameOver) {
      toast({
        title: "Game Over!",
        description: `Final score: ${score}`,
        variant: "destructive"
      });
    }
  }, [isGameOver, score, toast]);

  useEffect(() => {
    if (isGameOver || isPaused) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      if (deltaTime === 0) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      movePlayer();

      const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
      
      // Spawn objects based on level settings and time passed
      if (Math.random() < levelSettings.spawnRate * deltaTime * 0.1) {
        createFallingObject();
      }

      // Power-ups should be rare (and with a minimum time between them)
      const now = Date.now();
      const timeSinceLastPowerUp = now - lastPowerUpTime.current;
      if (timeSinceLastPowerUp > 15000 && Math.random() < levelSettings.powerUpChance * deltaTime * 0.01) {
        createPowerUp();
        lastPowerUpTime.current = now;
      }

      updateFallingObjects(deltaTime);
      
      if (playerRef.current) {
        checkCollisions(playerRef.current.getBoundingClientRect());
      }

      // Progress level based on score
      const newLevel = Math.min(3, Math.floor(score / 1500) + 1);
      if (newLevel !== currentLevel) {
        setCurrentLevel(newLevel);
        toast({
          title: `Level ${newLevel}!`,
          description: "Speed and difficulty increased!",
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isGameOver, isPaused, gameWidth, gameHeight, score, currentLevel, movePlayer, createFallingObject, createPowerUp, updateFallingObjects, checkCollisions, toast]);

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setFallingObjects([]);
    setCurrentLevel(1);
    setIsGameOver(false);
    lastPowerUpTime.current = 0;
    
    cleanupPowerUps();
    
    toast({
      title: "New Game Started!",
      description: "Catch the coins and avoid the obstacles!",
    });
  };

  return (
    <div 
      ref={gameContainerRef} 
      className="game-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        ref={playerRef} 
        className={`player ${isInvincible ? 'invincible' : ''} ${hasDoublePoints ? 'double-points' : ''}`}
        style={{ 
          left: `${playerPosition.x}px`,
          bottom: `100px`,
          backgroundImage: `url('/lovable-uploads/27f7581b-1726-4a1a-a66e-f4c0190d4bc5.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          width: '64px',
          height: '64px'
        }}
      ></div>
      
      {fallingObjects.map((obj) => (
        <FallingObject key={obj.id} object={obj} />
      ))}
      
      <GameStats 
        score={score}
        currentLevel={currentLevel}
        lives={lives}
        isInvincible={isInvincible}
        hasDoublePoints={hasDoublePoints}
      />
      
      <MobileControls
        startMovingLeft={startMovingLeft}
        stopMovingLeft={stopMovingLeft}
        startMovingRight={startMovingRight}
        stopMovingRight={stopMovingRight}
      />
      
      <GameOver 
        isGameOver={isGameOver} 
        score={score} 
        resetGame={resetGame}
      />
    </div>
  );
};

export default Game;
