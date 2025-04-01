import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Coins, Heart, Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Game objects interfaces
interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface CoinObject extends GameObject {
  type: 'coin';
}

interface ObstacleObject extends GameObject {
  type: 'obstacle';
}

interface PowerUpObject extends GameObject {
  type: 'powerup';
  powerType: 'invincibility';
}

type FallingObject = CoinObject | ObstacleObject | PowerUpObject;

// Game levels
const GAME_LEVELS = {
  1: { speed: 0.2, spawnRate: 0.02, obstacleRate: 0.3, powerUpChance: 0.02 },
  2: { speed: 0.3, spawnRate: 0.03, obstacleRate: 0.4, powerUpChance: 0.015 },
  3: { speed: 0.4, spawnRate: 0.04, obstacleRate: 0.5, powerUpChance: 0.01 }
};

const Game: React.FC = () => {
  const { toast } = useToast();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const dogRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const lastPlayerPositionsRef = useRef<Array<{x: number, direction: 'left' | 'right'}>>([]);
  const [gameWidth, setGameWidth] = useState<number>(0);
  const [gameHeight, setGameHeight] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [playerPosition, setPlayerPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dogPosition, setDogPosition] = useState<{ x: number; direction: 'left' | 'right' }>({ x: 0, direction: 'right' });
  const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [playerDirection, setPlayerDirection] = useState<'left' | 'right'>('right');
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [isDogWalking, setIsDogWalking] = useState<boolean>(false);
  
  const keysPressed = useRef<{left: boolean, right: boolean}>({
    left: false,
    right: false
  });
  
  const playerSpeed = 5;
  
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [hasDoublePoints, setHasDoublePoints] = useState<boolean>(false);
  const invincibilityTimeoutRef = useRef<number | null>(null);
  const doublePointsTimeoutRef = useRef<number | null>(null);
  const lastPowerUpTime = useRef<number>(0);

  const [isMuscleMartin, setIsMuscleMartin] = useState<boolean>(false);

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
      if (invincibilityTimeoutRef.current) {
        clearTimeout(invincibilityTimeoutRef.current);
      }
      if (doublePointsTimeoutRef.current) {
        clearTimeout(doublePointsTimeoutRef.current);
      }
    };
  }, [toast]);

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
        createFallingObject();
      }

      const now = Date.now();
      const timeSinceLastPowerUp = now - lastPowerUpTime.current;
      if (timeSinceLastPowerUp > 15000 && Math.random() < levelSettings.powerUpChance * deltaTime * 0.01) {
        createPowerUp();
        lastPowerUpTime.current = now;
      }

      updateFallingObjects(deltaTime);
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
  }, [isGameOver, isPaused, gameWidth, gameHeight, score, currentLevel, toast]);

  useEffect(() => {
    lastPlayerPositionsRef.current.push({ x: playerPosition.x, direction: playerDirection });
    
    if (lastPlayerPositionsRef.current.length > 15) {
      lastPlayerPositionsRef.current.shift();
    }
    
    if (lastPlayerPositionsRef.current.length >= 10) {
      const targetPosition = lastPlayerPositionsRef.current[0];
      let dogX = targetPosition.x;
      
      if (targetPosition.direction === 'right') {
        dogX = dogX - 60;
      } else {
        dogX = dogX + 60;
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

  const createFallingObject = () => {
    if (!gameWidth) return;

    const id = Date.now() + Math.random();
    const width = 30;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    
    const isCoin = Math.random() > levelSettings.obstacleRate;
    const speed = levelSettings.speed * (1 + Math.random() * 0.5);

    const newObject: FallingObject = {
      id,
      x,
      y: -30,
      width,
      height: 30,
      speed,
      type: isCoin ? 'coin' : 'obstacle'
    };

    setFallingObjects(prev => [...prev, newObject]);
  };

  const createPowerUp = () => {
    if (!gameWidth) return;
    
    const id = Date.now() + Math.random();
    const width = 40;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    const speed = levelSettings.speed * 0.8;

    const powerType = 'invincibility';

    const newPowerUp: PowerUpObject = {
      id,
      x,
      y: -30,
      width,
      height: 40,
      speed,
      type: 'powerup',
      powerType
    };
    
    setFallingObjects(prev => [...prev, newPowerUp]);
  };

  const updateFallingObjects = (deltaTime: number) => {
    setFallingObjects(prev => 
      prev
        .map(obj => ({
          ...obj,
          y: obj.y + obj.speed * deltaTime
        }))
        .filter(obj => obj.y < (gameHeight + obj.height))
    );
  };

  const checkCollisions = () => {
    if (!playerRef.current) return;

    const playerRect = playerRef.current.getBoundingClientRect();
    const playerX = playerRect.left;
    const playerY = playerRect.top;
    const playerWidth = playerRect.width;
    const playerHeight = playerRect.height;

    setFallingObjects(prev => {
      const remaining = [];
      let scoreIncrement = 0;
      let lostLife = false;
      let powerupCollected = false;
      let powerupType: PowerUpObject['powerType'] | null = null;

      for (const obj of prev) {
        const objectRect = {
          left: obj.x,
          top: obj.y,
          right: obj.x + obj.width,
          bottom: obj.y + obj.height
        };

        if (
          playerX < objectRect.right &&
          playerX + playerWidth > objectRect.left &&
          playerY < objectRect.bottom &&
          playerY + playerHeight > objectRect.top
        ) {
          if (obj.type === 'coin') {
            scoreIncrement += hasDoublePoints ? 2 : 1;
          } else if (obj.type === 'obstacle') {
            if (!isInvincible) {
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
        handlePowerUp(powerupType);
      }

      return remaining;
    });
  };

  const handlePowerUp = (powerType: PowerUpObject['powerType']) => {
    if (powerType === 'invincibility') {
      setIsInvincible(true);
      setIsMuscleMartin(true);
      toast({
        title: "MUSCLE POWER!",
        description: "Martin transforms into MuscleMartin! Invincible for 5 seconds!",
      });
      
      if (invincibilityTimeoutRef.current) {
        clearTimeout(invincibilityTimeoutRef.current);
      }
      
      invincibilityTimeoutRef.current = window.setTimeout(() => {
        setIsInvincible(false);
        setIsMuscleMartin(false);
        toast({
          title: "Invincibility ended!",
          description: "Be careful now!",
        });
      }, 5000);
    }
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
    setIsInvincible(false);
    setHasDoublePoints(false);
    lastPowerUpTime.current = 0;
    
    if (invincibilityTimeoutRef.current) {
      clearTimeout(invincibilityTimeoutRef.current);
    }
    
    if (doublePointsTimeoutRef.current) {
      clearTimeout(doublePointsTimeoutRef.current);
    }
    
    toast({
      title: "New Game Started!",
      description: "Catch the coins and avoid the obstacles!",
    });
  };

  return (
    <div 
      ref={gameContainerRef} 
      className={`game-container ${isInvincible ? 'earthquake' : ''}`}
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
      <div 
        ref={playerRef} 
        className={`player ${isInvincible ? 'invincible' : ''} ${hasDoublePoints ? 'double-points' : ''} ${isWalking ? 'walking' : ''}`}
        style={{ 
          left: `${playerPosition.x}px`,
          bottom: `100px`,
          backgroundImage: isMuscleMartin 
            ? `url('/images/MuscleMartin.png')`
            : `url('/images/Martin.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          transform: playerDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          transition: 'transform 0.2s ease-out',
          width: isMuscleMartin ? '108px' : '72px',
          height: '72px'
        }}
      ></div>
      
      <div 
        ref={dogRef} 
        className={`dog ${isDogWalking ? 'walking' : ''}`}
        style={{ 
          left: `${dogPosition.x}px`,
          bottom: `100px`,
          backgroundImage: `url('/images/Dog.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          transform: dogPosition.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
          width: '40px',
          height: '40px'
        }}
      ></div>
      
      {fallingObjects.map((obj) => (
        <div
          key={obj.id}
          className={
            obj.type === 'coin' 
              ? 'coin' 
              : obj.type === 'obstacle' 
                ? 'obstacle' 
                : `powerup powerup-${obj.powerType}`
          }
          style={{
            left: `${obj.x}px`,
            top: `${obj.y}px`,
            width: `${obj.width}px`,
            height: `${obj.height}px`,
            borderRadius: obj.type === 'coin' ? '50%' : obj.type === 'powerup' ? '0' : '0px',
            backgroundImage: obj.type === 'powerup' ? `url('/images/lemon.webp')` : 'none',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        ></div>
      ))}
      
      <div className="game-stats">
        <div className="flex items-center mb-2">
          <Coins className="mr-2" size={20} color="gold" />
          <span>{score}</span>
        </div>
        <div className="flex items-center mb-2">
          <span className="mr-2">Level: {currentLevel}</span>
        </div>
        <div className="flex items-center">
          {Array.from({ length: lives }).map((_, i) => (
            <Heart key={i} size={20} color="red" fill="red" className="mr-1" />
          ))}
        </div>
        <div className="flex items-center mt-2">
          {isInvincible && (
            <div className="flex items-center mr-2 text-yellow-400">
              <Star size={16} className="mr-1" />
              <span>Invincible</span>
            </div>
          )}
          {hasDoublePoints && (
            <div className="flex items-center text-green-400">
              <Coins size={16} className="mr-1" />
              <span>2x Points</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mobile-controls">
        <button 
          className="control-button left-button"
          onTouchStart={startMovingLeft}
          onTouchEnd={stopMovingLeft}
          onMouseDown={startMovingLeft}
          onMouseUp={stopMovingLeft}
          onMouseLeave={stopMovingLeft}
        >
          &larr;
        </button>
        <button 
          className="control-button right-button"
          onTouchStart={startMovingRight}
          onTouchEnd={stopMovingRight}
          onMouseDown={startMovingRight}
          onMouseUp={stopMovingRight}
          onMouseLeave={stopMovingRight}
        >
          &rarr;
        </button>
      </div>
      
      <div className={`game-over ${isGameOver ? '' : 'hidden'}`}>
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl mb-6">Final Score: {score}</p>
        <Button onClick={resetGame} className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
          Play Again
        </Button>
      </div>
    </div>
  );
};

export default Game;
