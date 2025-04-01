
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Coin, Heart } from 'lucide-react';
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

type FallingObject = CoinObject | ObstacleObject;

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
  const [difficulty, setDifficulty] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);

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
    };
  }, [toast]);

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

      // Create new objects based on difficulty
      if (Math.random() < 0.02 * difficulty) {
        createFallingObject();
      }

      // Update all falling objects
      updateFallingObjects(deltaTime);

      // Check collisions
      checkCollisions();

      // Update difficulty based on score
      setDifficulty(1 + Math.floor(score / 10) * 0.2);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isGameOver, isPaused, gameWidth, gameHeight, score, playerPosition, fallingObjects]);

  // Create falling objects
  const createFallingObject = () => {
    if (!gameWidth) return;

    const id = Date.now();
    const width = 30;
    const x = Math.random() * (gameWidth - width);
    const isCoin = Math.random() > 0.3; // 70% chance for coins, 30% for obstacles
    const speed = (1 + Math.random() * difficulty) * 0.2; // Speed increases with difficulty

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
            scoreIncrement++;
          } else if (obj.type === 'obstacle') {
            lostLife = true;
          }
        } else {
          remaining.push(obj);
        }
      }

      // Update score and lives
      if (scoreIncrement > 0) {
        setScore(s => s + scoreIncrement);
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

      return remaining;
    });
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

  // Reset game function
  const resetGame = () => {
    setScore(0);
    setLives(3);
    setFallingObjects([]);
    setDifficulty(1);
    setIsGameOver(false);
    
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
        className="player"
        style={{ 
          left: `${playerPosition.x}px`,
          bottom: `100px`
        }}
      ></div>
      
      {/* Falling objects */}
      {fallingObjects.map((obj) => (
        <div
          key={obj.id}
          className={obj.type === 'coin' ? 'coin' : 'obstacle'}
          style={{
            left: `${obj.x}px`,
            top: `${obj.y}px`,
            width: `${obj.width}px`,
            height: `${obj.height}px`,
            borderRadius: obj.type === 'coin' ? '50%' : '0px'
          }}
        ></div>
      ))}
      
      {/* Game stats display */}
      <div className="game-stats">
        <div className="flex items-center mb-2">
          <Coin className="mr-2" size={20} color="gold" />
          <span>{score}</span>
        </div>
        <div className="flex items-center">
          {Array.from({ length: lives }).map((_, i) => (
            <Heart key={i} size={20} color="red" fill="red" className="mr-1" />
          ))}
        </div>
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
