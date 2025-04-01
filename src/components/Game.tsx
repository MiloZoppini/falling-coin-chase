import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Coins, Star, Trophy, Medal } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import PlayerNameModal from './PlayerNameModal';
import { getHighScores, saveHighScore, HighScore } from '@/services/supabaseService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  coinType: 'bitcoin' | 'moneycash' | 'saccosoldi';
  pointValue: number;
}

interface ObstacleObject extends GameObject {
  type: 'obstacle';
}

interface PowerUpObject extends GameObject {
  type: 'powerup';
  powerType: 'invincibility';
}

interface HeartObject extends GameObject {
  type: 'heart';
}

interface VodkaObject extends GameObject {
  type: 'vodka';
}

type FallingObject = CoinObject | ObstacleObject | PowerUpObject | HeartObject | VodkaObject;

const GAME_LEVELS = {
  1: { speed: 0.2, spawnRate: 0.02, obstacleRate: 0.3, powerUpChance: 0.02, heartChance: 0.05, vodkaChance: 0.02 },
  2: { speed: 0.3, spawnRate: 0.03, obstacleRate: 0.4, powerUpChance: 0.015, heartChance: 0.04, vodkaChance: 0.025 },
  3: { speed: 0.4, spawnRate: 0.04, obstacleRate: 0.5, powerUpChance: 0.01, heartChance: 0.03, vodkaChance: 0.03 }
};

const COIN_TYPES = {
  bitcoin: { imagePath: '/images/bitcoin.png', pointValue: 500, width: 30, height: 30, probability: 0.4 },
  moneycash: { imagePath: '/images/moneycash.png', pointValue: 100, width: 36, height: 24, probability: 0.35 },
  saccosoldi: { imagePath: '/images/saccosoldi.png', pointValue: 200, width: 36, height: 36, probability: 0.25 }
};

const Game: React.FC = () => {
  const isMobile = useIsMobile();
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
  const [isEjecting, setIsEjecting] = useState<boolean>(false);
  
  const keysPressed = useRef<{left: boolean, right: boolean}>({
    left: false,
    right: false
  });
  
  const playerSpeed = 5;
  
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isInvincible, setIsInvincible] = useState<boolean>(false);
  const [invincibilityTimeLeft, setInvincibilityTimeLeft] = useState<number>(0);
  const [hasDoublePoints, setHasDoublePoints] = useState<boolean>(false);
  const invincibilityTimeoutRef = useRef<number | null>(null);
  const doublePointsTimeoutRef = useRef<number | null>(null);
  const lastPowerUpTime = useRef<number>(0);
  const lastHeartSpawnTime = useRef<number>(0);
  const lastVodkaSpawnTime = useRef<number>(0);

  const [isMuscleMartin, setIsMuscleMartin] = useState<boolean>(false);
  const [isHurt, setIsHurt] = useState<boolean>(false);
  const hurtTimeoutRef = useRef<number | null>(null);
  
  const [areControlsReversed, setAreControlsReversed] = useState<boolean>(false);
  const controlsReversedTimeoutRef = useRef<number | null>(null);
  const [controlsReversedTimeLeft, setControlsReversedTimeLeft] = useState<number>(0);

  const [playerName, setPlayerName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [savedScore, setSavedScore] = useState<boolean>(false);

  useEffect(() => {
    const loadHighScores = async () => {
      const scores = await getHighScores();
      setHighScores(scores);
    };
    
    loadHighScores();
  }, []);

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
      if (controlsReversedTimeoutRef.current) {
        clearTimeout(controlsReversedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isGameOver && !savedScore && playerName) {
      const saveScore = async () => {
        await saveHighScore(playerName, score);
        setSavedScore(true);
        
        const scores = await getHighScores();
        setHighScores(scores);
      };
      
      saveScore();
    }
  }, [isGameOver, savedScore, playerName, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || isEjecting) return;
      
      if (areControlsReversed) {
        if (e.key === 'ArrowRight' || e.key === 'd') {
          keysPressed.current.left = true;
          setIsWalking(true);
        }
        if (e.key === 'ArrowLeft' || e.key === 'a') {
          keysPressed.current.right = true;
          setIsWalking(true);
        }
      } else {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
          keysPressed.current.left = true;
          setIsWalking(true);
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
          keysPressed.current.right = true;
          setIsWalking(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (areControlsReversed) {
        if (e.key === 'ArrowRight' || e.key === 'd') {
          keysPressed.current.left = false;
          if (!keysPressed.current.right) setIsWalking(false);
        }
        if (e.key === 'ArrowLeft' || e.key === 'a') {
          keysPressed.current.right = false;
          if (!keysPressed.current.left) setIsWalking(false);
        }
      } else {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
          keysPressed.current.left = false;
          if (!keysPressed.current.right) setIsWalking(false);
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
          keysPressed.current.right = false;
          if (!keysPressed.current.left) setIsWalking(false);
        }
      }
    };

    if (!isMobile) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOver, isEjecting, isMobile, areControlsReversed]);

  useEffect(() => {
    if (!playerName || isGameOver || isPaused) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }
    
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
      
      const timeSinceLastHeart = now - lastHeartSpawnTime.current;
      if (timeSinceLastHeart > 8000 && Math.random() < levelSettings.heartChance * deltaTime * 0.01) {
        createHeart();
        lastHeartSpawnTime.current = now;
      }
      
      const timeSinceLastVodka = now - lastVodkaSpawnTime.current;
      if (timeSinceLastVodka > 12000 && Math.random() < levelSettings.vodkaChance * deltaTime * 0.01) {
        createVodka();
        lastVodkaSpawnTime.current = now;
      }

      updateFallingObjects(deltaTime);
      checkCollisions();

      const newLevel = Math.min(3, Math.floor(score / 1500) + 1);
      if (newLevel !== currentLevel) {
        setCurrentLevel(newLevel);
      }

      if (isInvincible) {
        setInvincibilityTimeLeft(prev => {
          const newValue = Math.max(0, prev - deltaTime / 1000);
          if (newValue <= 0) {
            if (invincibilityTimeoutRef.current) {
              clearTimeout(invincibilityTimeoutRef.current);
              invincibilityTimeoutRef.current = null;
            }
            setIsInvincible(false);
            setIsMuscleMartin(false);
            if (gameContainerRef.current) {
              gameContainerRef.current.classList.remove('earthquake');
            }
          }
          return newValue;
        });
      }
      
      if (areControlsReversed) {
        setControlsReversedTimeLeft(prev => {
          const newValue = Math.max(0, prev - deltaTime / 1000);
          if (newValue <= 0) {
            if (controlsReversedTimeoutRef.current) {
              clearTimeout(controlsReversedTimeoutRef.current);
              controlsReversedTimeoutRef.current = null;
            }
            setAreControlsReversed(false);
          }
          return newValue;
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
  }, [isGameOver, isPaused, gameWidth, gameHeight, score, currentLevel, isEjecting, playerName, isInvincible, areControlsReversed]);

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
    if (isEjecting) return;
    
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
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    
    const isCoin = Math.random() > levelSettings.obstacleRate;
    const speed = levelSettings.speed * (1 + Math.random() * 0.5);

    if (isCoin) {
      const rand = Math.random();
      let coinType: keyof typeof COIN_TYPES;
      let cumulativeProbability = 0;
      
      for (const type in COIN_TYPES) {
        const typeKey = type as keyof typeof COIN_TYPES;
        cumulativeProbability += COIN_TYPES[typeKey].probability;
        if (rand < cumulativeProbability) {
          coinType = typeKey;
          break;
        }
      }
      
      coinType = coinType || 'bitcoin';
      
      const coinInfo = COIN_TYPES[coinType];
      const width = coinInfo.width;
      const height = coinInfo.height;
      const x = Math.random() * (gameWidth - width);
      
      const newCoin: CoinObject = {
        id,
        x,
        y: -30,
        width,
        height,
        speed,
        type: 'coin',
        coinType,
        pointValue: coinInfo.pointValue
      };
      
      setFallingObjects(prev => [...prev, newCoin]);
    } else {
      const width = 48;
      const height = 48;
      const x = Math.random() * (gameWidth - width);
      
      const newObstacle: ObstacleObject = {
        id,
        x,
        y: -30,
        width,
        height,
        speed,
        type: 'obstacle'
      };
      
      setFallingObjects(prev => [...prev, newObstacle]);
    }
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

  const createHeart = () => {
    if (!gameWidth) return;
    
    const id = Date.now() + Math.random();
    const width = 30;
    const height = 30;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    const speed = levelSettings.speed * 0.7;

    const newHeart: HeartObject = {
      id,
      x,
      y: -30, // Start above the screen
      width,
      height,
      speed,
      type: 'heart'
    };
    
    setFallingObjects(prev => [...prev, newHeart]);
  };

  const createVodka = () => {
    if (!gameWidth) return;
    
    const id = Date.now() + Math.random();
    const width = 36;
    const height = 36;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    const speed = levelSettings.speed * 0.75;

    const newVodka: VodkaObject = {
      id,
      x,
      y: -30,
      width,
      height,
      speed,
      type: 'vodka'
    };
    
    setFallingObjects(prev => [...prev, newVodka]);
  };

  const updateFallingObjects = (deltaTime: number) => {
    setFallingObjects(prev => 
      prev
        .map(obj => ({
          ...obj,
          y: obj.y + obj.speed * deltaTime
        }))
        .filter(obj => obj.y < (gameHeight + 50)) // Increased height threshold to ensure objects fully leave the screen
    );
  };

  const checkCollisions = () => {
    if (!playerRef.current) return;

    const playerRect = playerRef.current.getBoundingClientRect();
    const gameRect = gameContainerRef.current?.getBoundingClientRect();
    
    if (!gameRect) return;
    
    const playerX = playerRect.left - gameRect.left;
    const playerY = playerRect.top - gameRect.top;
    const playerWidth = playerRect.width;
    const playerHeight = playerRect.height;

    const hitboxReduction = playerWidth * 0.25;
    const preciseHitbox = {
      left: playerX + hitboxReduction,
      top: playerY + playerHeight * 0.1,
      right: playerX + playerWidth - hitboxReduction,
      bottom: playerY + playerHeight - playerHeight * 0.05,
      width: playerWidth - (hitboxReduction * 2),
      height: playerHeight - (playerHeight * 0.15)
    };

    setFallingObjects(prev => {
      const remaining = [];
      let scoreIncrement = 0;
      let lostLife = false;
      let powerupCollected = false;
      let powerupType: PowerUpObject['powerType'] | null = null;
      let heartCollected = false;
      let vodkaCollected = false;

      for (const obj of prev) {
        // Calculate object position relative to game container
        const objectRect = {
          left: obj.x,
          top: obj.y,
          right: obj.x + obj.width,
          bottom: obj.y + obj.height
        };

        const collision = 
          preciseHitbox.left < objectRect.right &&
          preciseHitbox.right > objectRect.left &&
          preciseHitbox.top < objectRect.bottom &&
          preciseHitbox.bottom > objectRect.top;

        if (collision) {
          if (obj.type === 'coin') {
            const pointsAwarded = hasDoublePoints ? obj.pointValue * 2 : obj.pointValue;
            scoreIncrement += pointsAwarded;
          } else if (obj.type === 'obstacle') {
            if (!isInvincible) {
              lostLife = true;
            }
          } else if (obj.type === 'powerup') {
            powerupCollected = true;
            powerupType = obj.powerType;
          } else if (obj.type === 'heart') {
            heartCollected = true;
          } else if (obj.type === 'vodka') {
            vodkaCollected = true;
          }
        } else {
          remaining.push(obj);
        }
      }

      if (scoreIncrement > 0) {
        setScore(s => s + scoreIncrement);
      }
      
      if (lostLife) {
        setLives(l => {
          const newLives = l - 1;
          
          if (!isHurt) {
            setIsHurt(true);
            
            if (hurtTimeoutRef.current) {
              clearTimeout(hurtTimeoutRef.current);
            }
            
            hurtTimeoutRef.current = window.setTimeout(() => {
              setIsHurt(false);
            }, 900);
          }
          
          if (newLives <= 0) {
            setIsEjecting(true);
            keysPressed.current.left = false;
            keysPressed.current.right = false;
            setIsWalking(false);
            
            setIsGameOver(true);
            
            setTimeout(() => {
              const gameOverElement = document.querySelector('.game-over');
              if (gameOverElement) {
                gameOverElement.classList.add('visible');
              }
            }, 0);
          }
          return newLives;
        });
      }
      
      if (heartCollected) {
        setLives(l => Math.min(l + 1, 5)); // Maximum 5 lives
      }
      
      if (powerupCollected && powerupType) {
        handlePowerUp(powerupType);
      }
      
      if (vodkaCollected) {
        handleVodkaEffect();
      }

      return remaining;
    });
  };

  const handlePowerUp = (powerType: PowerUpObject['powerType']) => {
    if (powerType === 'invincibility') {
      const invincibilityDuration = 5; // 5 seconds
      
      if (invincibilityTimeoutRef.current) {
        clearTimeout(invincibilityTimeoutRef.current);
      }
      
      setIsInvincible(true);
      setIsMuscleMartin(true);
      setInvincibilityTimeLeft(invincibilityDuration);
      
      if (gameContainerRef.current) {
        gameContainerRef.current.classList.add('earthquake');
      }
      
      invincibilityTimeoutRef.current = window.setTimeout(() => {
        setIsInvincible(false);
        setIsMuscleMartin(false);
        setInvincibilityTimeLeft(0);
        
        if (gameContainerRef.current) {
          gameContainerRef.current.classList.remove('earthquake');
        }
        
        invincibilityTimeoutRef.current = null;
      }, invincibilityDuration * 1000);
    }
  };
  
  const handleVodkaEffect = () => {
    const vodkaDuration = 8; // 8 seconds of reversed controls
    
    if (controlsReversedTimeoutRef.current) {
      clearTimeout(controlsReversedTimeoutRef.current);
    }
    
    setAreControlsReversed(true);
    setControlsReversedTimeLeft(vodkaDuration);
    
    controlsReversedTimeoutRef.current = window.setTimeout(() => {
      setAreControlsReversed(false);
      setControlsReversedTimeLeft(0);
      controlsReversedTimeoutRef.current = null;
    }, vodkaDuration * 1000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isGameOver || isEjecting) return;
    
    const touchX = e.touches[0].clientX;
    const centerX = window.innerWidth / 2;
    
    keysPressed.current.left = false;
    keysPressed.current.right = false;
    
    if (areControlsReversed) {
      if (touchX >= centerX) {
        keysPressed.current.left = true;
        setPlayerDirection('left');
      } else {
        keysPressed.current.right = true;
        setPlayerDirection('right');
      }
    } else {
      if (touchX < centerX) {
        keysPressed.current.left = true;
        setPlayerDirection('left');
      } else {
        keysPressed.current.right = true;
        setPlayerDirection('right');
      }
    }
    
    setIsWalking(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isGameOver || isEjecting) return;
    
    const touchX = e.touches[0].clientX;
    const centerX = window.innerWidth / 2;
    
    keysPressed.current.left = false;
    keysPressed.current.right = false;
    
    if (areControlsReversed) {
      if (touchX >= centerX) {
        keysPressed.current.left = true;
        setPlayerDirection('left');
      } else {
        keysPressed.current.right = true;
        setPlayerDirection('right');
      }
    } else {
      if (touchX < centerX) {
        keysPressed.current.left = true;
        setPlayerDirection('left');
      } else {
        keysPressed.current.right = true;
        setPlayerDirection('right');
      }
    }
  };

  const handleTouchEnd = () => {
    keysPressed.current.left = false;
    keysPressed.current.right = false;
    setIsWalking(false);
  };

  const startMovingLeft = () => {
    if (!isGameOver && !isEjecting) {
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
    if (!isGameOver && !isEjecting) {
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
    setIsHurt(false);
    setIsEjecting(false);
    setSavedScore(false);
    setAreControlsReversed(false);
    lastPowerUpTime.current = 0;
    
    const gameOverElement = document.querySelector('.game-over');
    if (gameOverElement) {
      gameOverElement.classList.remove('visible');
    }
    
    if (invincibilityTimeoutRef.current) {
      clearTimeout(invincibilityTimeoutRef.current);
      invincibilityTimeoutRef.current = null;
    }
    
    if (doublePointsTimeoutRef.current) {
      clearTimeout(doublePointsTimeoutRef.current);
      doublePointsTimeoutRef.current = null;
    }
    
    if (hurtTimeoutRef.current) {
      clearTimeout(hurtTimeoutRef.current);
      hurtTimeoutRef.current = null;
    }
    
    if (controlsReversedTimeoutRef.current) {
      clearTimeout(controlsReversedTimeoutRef.current);
      controlsReversedTimeoutRef.current = null;
    }
  };

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setShowNameModal(false);
    
    setScore(0);
    setLives(3);
    setFallingObjects([]);
    setCurrentLevel(1);
    setIsGameOver(false);
    setIsInvincible(false);
    setHasDoublePoints(false);
    setIsHurt(false);
    setIsEjecting(false);
    setSavedScore(false);
    setAreControlsReversed(false);
    lastPowerUpTime.current = 0;
  };

  const getMedalColor = (position: number): string => {
    switch (position) {
      case 0: return "gold";
      case 1: return "silver";
      case 2: return "#CD7F32";
      default: return "currentColor";
    }
  };

  return (
    <div 
      ref={gameContainerRef} 
      className="game-container font-pixel"
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
      {showNameModal && (
        <PlayerNameModal onSubmit={handleNameSubmit} />
      )}
      
      {playerName && (
        <>
          <div 
            ref={playerRef} 
            className={`player ${isInvincible ? 'invincible' : ''} ${hasDoublePoints ? 'double-points' : ''} ${isWalking ? 'walking' : ''} ${isHurt ? 'hurt' : ''} ${isEjecting ? 'ejecting' : ''} ${areControlsReversed ? 'drunk' : ''}`}
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
            className={`dog ${isDogWalking ? 'walking' : ''} ${isEjecting ? 'ejecting' : ''}`}
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
                  ? `coin coin-${(obj as CoinObject).coinType}` 
                  : obj.type === 'obstacle' 
                    ? 'obstacle' 
                    : obj.type === 'heart'
                      ? 'heart'
                      : obj.type === 'vodka'
                        ? 'vodka'
                        : `powerup powerup-${(obj as PowerUpObject).powerType}`
              }
              style={{
                left: `${obj.x}px`,
                top: `${obj.y}px`,
                width: `${obj.width}px`,
                height: `${obj.height}px`,
                backgroundColor: 'transparent',
                backgroundImage: obj.type === 'coin' 
                  ? `url('${COIN_TYPES[(obj as CoinObject).coinType].imagePath}')` 
                  : obj.type === 'powerup' 
                    ? `url('/images/lemon.webp')` 
                    : obj.type === '
