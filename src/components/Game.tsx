
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Coins, Heart, Star } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

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
  powerType: 'invincibility' | 'extraLife' | 'doublePoints';
}

type FallingObject = CoinObject | ObstacleObject | PowerUpObject;

// Livelli di gioco
const GAME_LEVELS = {
  1: { speed: 0.2, spawnRate: 0.02, obstacleRate: 0.3, powerUpChance: 0.05 },
  2: { speed: 0.3, spawnRate: 0.03, obstacleRate: 0.35, powerUpChance: 0.1 },
  3: { speed: 0.4, spawnRate: 0.04, obstacleRate: 0.4, powerUpChance: 0.15 }
};

const Game: React.FC = () => {
  const { toast } = useToast();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const [gameWidth, setGameWidth] = useState<number>(0);
  const [gameHeight, setGameHeight] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [playerPosition, setPlayerPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Movimento del giocatore
  const [isMovingLeft, setIsMovingLeft] = useState<boolean>(false);
  const [isMovingRight, setIsMovingRight] = useState<boolean>(false);
  const playerSpeed = 8; // Velocità di movimento del giocatore
  
  // Livelli e powerup
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [hasDoublePoints, setHasDoublePoints] = useState<boolean>(false);
  const invincibilityTimeoutRef = useRef<number | null>(null);
  const doublePointsTimeoutRef = useRef<number | null>(null);

  // Initial setup
  useEffect(() => {
    const handleResize = () => {
      if (gameContainerRef.current) {
        const { width, height } = gameContainerRef.current.getBoundingClientRect();
        setGameWidth(width);
        setGameHeight(height);
        
        // Update player position
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

    // Show start toast
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setIsMovingLeft(true);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setIsMovingRight(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setIsMovingLeft(false);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        setIsMovingRight(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOver]);

  // Player movement
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const movePlayer = () => {
      setPlayerPosition(prev => {
        const playerWidth = playerRef.current?.offsetWidth || 40;
        let newX = prev.x;

        if (isMovingLeft) {
          newX = Math.max(0, newX - playerSpeed);
        }
        if (isMovingRight) {
          newX = Math.min(gameWidth - playerWidth, newX + playerSpeed);
        }

        return { ...prev, x: newX };
      });

      if (isMovingLeft || isMovingRight) {
        requestAnimationFrame(movePlayer);
      }
    };

    if (isMovingLeft || isMovingRight) {
      movePlayer();
    }
  }, [isMovingLeft, isMovingRight, isPaused, isGameOver, gameWidth]);

  // Game loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const gameLoop = (timestamp: number) => {
      // Calculate delta time for smooth animation
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      if (deltaTime === 0) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Get current level settings
      const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
      
      // Create new objects based on difficulty
      if (Math.random() < levelSettings.spawnRate * currentLevel) {
        createFallingObject();
      }

      // Spawn powerups based on chance
      if (Math.random() < levelSettings.powerUpChance) {
        createPowerUp();
      }

      // Update all falling objects
      updateFallingObjects(deltaTime);

      // Check collisions
      checkCollisions();

      // Update level based on score
      const newLevel = Math.min(3, Math.floor(score / 1000) + 1);
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
  }, [isGameOver, isPaused, gameWidth, gameHeight, score, playerPosition, fallingObjects, currentLevel, toast]);

  // Create falling objects
  const createFallingObject = () => {
    if (!gameWidth) return;

    const id = Date.now() + Math.random();
    const width = 30;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    
    const isCoin = Math.random() > levelSettings.obstacleRate; // Percentuale variabile di monete vs ostacoli
    const speed = levelSettings.speed * (1 + Math.random() * 0.5); // Velocità basata sul livello attuale

    const newObject: FallingObject = {
      id,
      x,
      y: -30, // Start above the visible screen
      width,
      height: 30,
      speed,
      type: isCoin ? 'coin' : 'obstacle'
    };

    setFallingObjects(prev => [...prev, newObject]);
  };
  
  // Create powerups
  const createPowerUp = () => {
    if (!gameWidth) return;
    
    const id = Date.now() + Math.random();
    const width = 30;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    const speed = levelSettings.speed * 0.8; // Powerups move a bit slower
    
    // Scegli casualmente un tipo di powerup
    const powerTypes: Array<PowerUpObject['powerType']> = ['invincibility', 'extraLife', 'doublePoints'];
    const powerType = powerTypes[Math.floor(Math.random() * powerTypes.length)];
    
    const newPowerUp: PowerUpObject = {
      id,
      x,
      y: -30,
      width,
      height: 30,
      speed,
      type: 'powerup',
      powerType
    };
    
    setFallingObjects(prev => [...prev, newPowerUp]);
  };

  // Update falling objects positions
  const updateFallingObjects = (deltaTime: number) => {
    setFallingObjects(prev => 
      prev
        .map(obj => ({
          ...obj,
          y: obj.y + obj.speed * deltaTime
        }))
        .filter(obj => obj.y < (gameHeight + obj.height)) // Remove objects that are out of screen
    );
  };

  // Check for collisions
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

        // Check if collision
        if (
          playerX < objectRect.right &&
          playerX + playerWidth > objectRect.left &&
          playerY < objectRect.bottom &&
          playerY + playerHeight > objectRect.top
        ) {
          // Handle collision based on object type
          if (obj.type === 'coin') {
            // Se è attivo il double points, raddoppia il punteggio
            scoreIncrement += hasDoublePoints ? 2 : 1;
          } else if (obj.type === 'obstacle') {
            // Se non siamo invincibili, perdiamo una vita
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

      // Update score and lives
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
      
      // Gestisci i powerup raccolti
      if (powerupCollected && powerupType) {
        handlePowerUp(powerupType);
      }

      return remaining;
    });
  };
  
  // Gestisci i powerup raccolti
  const handlePowerUp = (powerType: PowerUpObject['powerType']) => {
    switch (powerType) {
      case 'invincibility':
        setIsInvincible(true);
        toast({
          title: "Invincibility!",
          description: "You are invincible for 5 seconds!",
        });
        
        // Clear any existing timeout
        if (invincibilityTimeoutRef.current) {
          clearTimeout(invincibilityTimeoutRef.current);
        }
        
        // Set new timeout
        invincibilityTimeoutRef.current = window.setTimeout(() => {
          setIsInvincible(false);
          toast({
            title: "Invincibility ended!",
            description: "Be careful now!",
          });
        }, 5000);
        break;
        
      case 'extraLife':
        setLives(l => {
          const newLives = l + 1;
          toast({
            title: "Extra Life!",
            description: `You now have ${newLives} lives!`,
          });
          return newLives;
        });
        break;
        
      case 'doublePoints':
        setHasDoublePoints(true);
        toast({
          title: "Double Points!",
          description: "Points are doubled for 10 seconds!",
        });
        
        // Clear any existing timeout
        if (doublePointsTimeoutRef.current) {
          clearTimeout(doublePointsTimeoutRef.current);
        }
        
        // Set new timeout
        doublePointsTimeoutRef.current = window.setTimeout(() => {
          setHasDoublePoints(false);
          toast({
            title: "Double Points ended!",
            description: "Back to normal points.",
          });
        }, 10000);
        break;
    }
  };

  // Touch input handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isGameOver) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isGameOver || touchStartXRef.current === null || !playerRef.current) return;
    
    const touchX = e.touches[0].clientX;
    const diffX = touchX - touchStartXRef.current;
    touchStartXRef.current = touchX;
    
    setPlayerPosition(prev => {
      const playerWidth = playerRef.current?.offsetWidth || 40;
      const newX = Math.max(0, Math.min(gameWidth - playerWidth, prev.x + diffX));
      return { ...prev, x: newX };
    });
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = null;
  };

  // Controlli con bottoni per dispositivi mobili
  const startMovingLeft = () => {
    if (!isGameOver) setIsMovingLeft(true);
  };

  const stopMovingLeft = () => {
    setIsMovingLeft(false);
  };

  const startMovingRight = () => {
    if (!isGameOver) setIsMovingRight(true);
  };

  const stopMovingRight = () => {
    setIsMovingRight(false);
  };

  // Reset game function
  const resetGame = () => {
    setScore(0);
    setLives(3);
    setFallingObjects([]);
    setCurrentLevel(1);
    setIsGameOver(false);
    setIsInvincible(false);
    setHasDoublePoints(false);
    
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
      className="game-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Player character */}
      <div 
        ref={playerRef} 
        className={`player ${isInvincible ? 'invincible' : ''} ${hasDoublePoints ? 'double-points' : ''}`}
        style={{ 
          left: `${playerPosition.x}px`,
          bottom: `100px`
        }}
      ></div>
      
      {/* Falling objects */}
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
            borderRadius: obj.type === 'coin' || obj.type === 'powerup' ? '50%' : '0px'
          }}
        ></div>
      ))}
      
      {/* Game stats display */}
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
        {/* Status indicators */}
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
      
      {/* Controlli mobili */}
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
      
      {/* Game over overlay */}
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
