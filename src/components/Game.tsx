import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import Player from './Player';
import Dog from './Dog';
import FallingObject from './FallingObject';
import GameStats from './GameStats';
import MobileControls from './MobileControls';
import GameOver from './GameOver';
import { usePowerUps } from '../hooks/usePowerUps';
import { 
  FallingObject as FallingObjectType, 
  GAME_LEVELS, 
  PlayerPosition, 
  DogPosition,
  Direction
} from '../types/game';
import { 
  createFallingObject, 
  createPowerUp, 
  updateFallingObjects, 
  checkCollision 
} from '../utils/gameUtils';

const Game: React.FC = () => {
  const { toast } = useToast();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const lastPlayerPositionsRef = useRef<Array<{x: number, direction: Direction}>>([]);
  const [gameWidth, setGameWidth] = useState<number>(0);
  const [gameHeight, setGameHeight] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({ x: 0, y: 0 });
  const [dogPosition, setDogPosition] = useState<DogPosition>({ x: 0, direction: 'right' });
  const [fallingObjects, setFallingObjects] = useState<FallingObjectType[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerDirection, setPlayerDirection] = useState<Direction>('right');
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [isDogWalking, setIsDogWalking] = useState<boolean>(false);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  
  const keysPressed = useRef<{left: boolean, right: boolean}>({
    left: false,
    right: false
  });
  
  const playerSpeed = 5;
  
  const { 
    isInvincible, 
    hasDoublePoints, 
    isMuscleMartin, 
    cameraShake, 
    lastPowerUpTime,
    handlePowerUp, 
    cleanupPowerUps,
    resetPowerUps
  } = usePowerUps();

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

    setTimeout(() => {
      toast({
        title: "Game Started!",
        description: "Catch the coins and avoid the obstacles!",
      });
    }, 0);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      cleanupPowerUps();
    };
  }, [toast, cleanupPowerUps]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        keysPressed.current.left = true;
        setIsWalking(true);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        keysPressed.current.right = true;
        setIsWalking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        keysPressed.current.left = false;
        if (!keysPressed.current.right) setIsWalking(false);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        keysPressed.current.right = false;
        if (!keysPressed.current.left) setIsWalking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOver]);

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
      
      if (Math.random() < levelSettings.spawnRate * deltaTime * 0.1) {
        setFallingObjects(prev => [...prev, createFallingObject(gameWidth, currentLevel)]);
      }

      const now = Date.now();
      const timeSinceLastPowerUp = now - lastPowerUpTime.current;
      if (timeSinceLastPowerUp > 15000 && Math.random() < levelSettings.powerUpChance * deltaTime * 0.01) {
        setFallingObjects(prev => [...prev, createPowerUp(gameWidth, currentLevel)]);
        lastPowerUpTime.current = now;
      }

      setFallingObjects(prev => updateFallingObjects(prev, deltaTime, gameHeight));
      checkCollisions();

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
  }, [isGameOver, isPaused, gameWidth, gameHeight, score, currentLevel, toast, isInvincible, isMuscleMartin, hasDoublePoints]);

  useEffect(() => {
    lastPlayerPositionsRef.current.push({ x: playerPosition.x, direction: playerDirection });
    
    if (lastPlayerPositionsRef.current.length > 20) {
      lastPlayerPositionsRef.current.shift();
    }
    
    if (lastPlayerPositionsRef.current.length >= 10) {
      const targetPosition = lastPlayerPositionsRef.current[0];
      const dogOffset = 40;
      
      let dogX = targetPosition.x;
      
      if (targetPosition.direction === 'right') {
        dogX = dogX - dogOffset;
      } else {
        dogX = dogX + dogOffset;
      }
      
      setDogPosition({
        x: dogX,
        direction: targetPosition.direction
      });
      
      setIsDogWalking(isWalking);
    }
  }, [playerPosition, playerDirection, isWalking]);

  const movePlayer = () => {
    setPlayerPosition(prev => {
      const playerWidth = playerRef.current?.offsetWidth || 40;
      let newX = prev.x;
      let isMoving = false;

      if (keysPressed.current.left && newX > 0) {
        newX = Math.max(0, newX - playerSpeed);
        setPlayerDirection('left');
        isMoving = true;
      }
      if (keysPressed.current.right && newX < gameWidth - playerWidth) {
        newX = Math.min(gameWidth - playerWidth, newX + playerSpeed);
        setPlayerDirection('right');
        isMoving = true;
      }

      setIsWalking(isMoving);
      return { ...prev, x: newX };
    });
  };

  const checkCollisions = () => {
    if (!playerRef.current) return;

    const playerRect = playerRef.current.getBoundingClientRect();
    const playerBounds = {
      left: playerRect.left,
      top: playerRect.top,
      right: playerRect.right,
      bottom: playerRect.bottom
    };

    setFallingObjects(prev => {
      const remaining = [];
      let scoreIncrement = 0;
      let lostLife = false;
      let powerupCollected = false;
      let powerupType = null;

      for (const obj of prev) {
        const objectBounds = {
          left: obj.x,
          top: obj.y,
          right: obj.x + obj.width,
          bottom: obj.y + obj.height
        };

        if (checkCollision(playerBounds, objectBounds)) {
          if (obj.type === 'coin') {
            scoreIncrement += hasDoublePoints ? 2 : 1;
          } else if (obj.type === 'obstacle') {
            if (!isInvincible && !isMuscleMartin) {
              lostLife = true;
            }
          } else if (obj.type === 'powerup') {
            powerupCollected = true;
            powerupType = obj.powerType;
          }
        } else {
          remaining.push(obj);
        }
      }

      if (scoreIncrement > 0) {
        setScore(s => s + scoreIncrement * 100);
      }
      
      if (lostLife) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setIsGameOver(true);
            toast({
              title: "Game Over!",
              description: `Final score: ${score}`,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Hit!",
              description: `${newLives} lives remaining`,
              variant: "destructive"
            });
          }
          return newLives;
        });
      }
      
      if (powerupCollected && powerupType) {
        if (powerupType === 'extraLife') {
          setLives(l => {
            const newLives = Math.min(5, l + 1);
            toast({
              title: "Extra Life!",
              description: `You now have ${newLives} lives!`,
            });
            return newLives;
          });
        } else {
          handlePowerUp(powerupType);
        }
      }

      return remaining;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isGameOver) return;
    touchStartXRef.current = e.touches[0].clientX;
    setIsWalking(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isGameOver || touchStartXRef.current === null || !playerRef.current) return;
    
    const touchX = e.touches[0].clientX;
    const diffX = touchX - touchStartXRef.current;
    touchStartXRef.current = touchX;
    
    setPlayerPosition(prev => {
      const playerWidth = playerRef.current?.offsetWidth || 40;
      const newX = Math.max(0, Math.min(gameWidth - playerWidth, prev.x + diffX));
      
      if (diffX < 0) {
        setPlayerDirection('left');
      } else if (diffX > 0) {
        setPlayerDirection('right');
      }
      
      setIsWalking(Math.abs(diffX) > 1);
      return { ...prev, x: newX };
    });
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = null;
    setIsWalking(false);
  };

  const startMovingLeft = () => {
    if (!isGameOver) {
      keysPressed.current.left = true;
      setPlayerDirection('left');
      setIsWalking(true);
    }
  };

  const stopMovingLeft = () => {
    keysPressed.current.left = false;
    if (!keysPressed.current.right) setIsWalking(false);
  };

  const startMovingRight = () => {
    if (!isGameOver) {
      keysPressed.current.right = true;
      setPlayerDirection('right');
      setIsWalking(true);
    }
  };

  const stopMovingRight = () => {
    keysPressed.current.right = false;
    if (!keysPressed.current.left) setIsWalking(false);
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setFallingObjects([]);
    setCurrentLevel(1);
    setIsGameOver(false);
    resetPowerUps();
    
    toast({
      title: "New Game Started!",
      description: "Catch the coins and avoid the obstacles!",
    });
  };

  return (
    <div 
      ref={gameContainerRef} 
      className={`game-container ${cameraShake ? 'camera-shake' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        backgroundImage: `url('/images/Background.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div ref={playerRef}>
        <Player 
          position={playerPosition}
          direction={playerDirection}
          isWalking={isWalking}
          isInvincible={isInvincible}
          hasDoublePoints={hasDoublePoints}
          isMuscleMartin={isMuscleMartin}
        />
      </div>
      
      <Dog 
        position={dogPosition}
        isWalking={isDogWalking}
      />
      
      {fallingObjects.map((obj) => (
        <FallingObject key={obj.id} object={obj} />
      ))}
      
      <GameStats 
        score={score}
        currentLevel={currentLevel}
        lives={lives}
        isInvincible={isInvincible}
        hasDoublePoints={hasDoublePoints}
        isMuscleMartin={isMuscleMartin}
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
