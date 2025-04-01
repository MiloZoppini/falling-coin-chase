import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Coins, Star, Trophy, Medal } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import PlayerNameModal from './PlayerNameModal';
import SheilaAnimation from './SheilaAnimation';
import { getHighScores, saveHighScore, HighScore } from '@/services/supabaseService';
import {
  Table,
  TableBody,
  TableCell,
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

interface PoopObject extends GameObject {
  type: 'poop';
  createdAt: number;
  onGround: boolean;
}

type FallingObject = CoinObject | ObstacleObject | PowerUpObject | HeartObject | VodkaObject | PoopObject;

const GAME_LEVELS = {
  1: { speed: 0.2, spawnRate: 0.02, obstacleRate: 0.3, powerUpChance: 0.02, heartChance: 0.15, vodkaChance: 0.02, poopChance: 0.8 },
  2: { speed: 0.3, spawnRate: 0.03, obstacleRate: 0.4, powerUpChance: 0.015, heartChance: 0.15, vodkaChance: 0.025, poopChance: 0.8 },
  3: { speed: 0.4, spawnRate: 0.04, obstacleRate: 0.5, powerUpChance: 0.01, heartChance: 0.15, vodkaChance: 0.03, poopChance: 0.8 }
};

const COIN_TYPES = {
  bitcoin: { imagePath: '/images/bitcoin.png', pointValue: 500, width: 30, height: 30, probability: 0.4 },
  moneycash: { imagePath: '/images/moneycash.png', pointValue: 100, width: 36, height: 24, probability: 0.35 },
  saccosoldi: { imagePath: '/images/saccosoldi.png', pointValue: 200, width: 36, height: 36, probability: 0.25 }
};

const POOP_POINT_VALUE = 150;
const POOP_WIDTH = 29;
const POOP_HEIGHT = 29;
const AUTO_POOP_INTERVAL = 10000;

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
  const [isVodkaActive, setIsVodkaActive] = useState<boolean>(false);
  
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
  const lastPoopTime = useRef<number>(0);
  const lastAutoPoopTime = useRef<number>(Date.now());

  const [isMuscleMartin, setIsMuscleMartin] = useState<boolean>(false);
  const [isHurt, setIsHurt] = useState<boolean>(false);
  const hurtTimeoutRef = useRef<number | null>(null);
  
  const [areControlsReversed, setAreControlsReversed] = useState<boolean>(false);
  const controlsReversedTimeoutRef = useRef<number | null>(null);
  const [controlsReversedTimeLeft, setControlsReversedTimeLeft] = useState<number>(0);

  const [playerName, setPlayerName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [showSheilaAnimation, setShowSheilaAnimation] = useState<boolean>(false);
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
      if (lives < 5 && timeSinceLastHeart > 10000 && Math.random() < levelSettings.heartChance * deltaTime * 0.01) {
        createHeart();
        lastHeartSpawnTime.current = now;
      }
      
      const timeSinceLastVodka = now - lastVodkaSpawnTime.current;
      if (timeSinceLastVodka > 12000 && Math.random() < levelSettings.vodkaChance * deltaTime * 0.01) {
        createVodka();
        lastVodkaSpawnTime.current = now;
      }
      
      const timeSinceLastPoop = now - lastPoopTime.current;
      if (timeSinceLastPoop > 5000 && Math.random() < levelSettings.poopChance * deltaTime * 0.01 && isDogWalking) {
        createPoop();
        lastPoopTime.current = now;
      }
      
      const timeSinceLastAutoPoop = now - lastAutoPoopTime.current;
      if (timeSinceLastAutoPoop > AUTO_POOP_INTERVAL) {
        createPoop();
        lastAutoPoopTime.current = now;
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
            setIsVodkaActive(false);
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
  }, [isGameOver, isPaused, gameWidth, gameHeight, score, currentLevel, isEjecting, playerName, isInvincible, areControlsReversed, isDogWalking, lives]);

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
      y: -30,
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
    const width = 43;
    const height = 43;
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

  const createPoop = () => {
    if (!gameWidth || !dogRef.current) return;
    
    const dogRect = dogRef.current.getBoundingClientRect();
    const id = Date.now() + Math.random();
    const width = POOP_WIDTH;
    const height = POOP_HEIGHT;
    
    const x = dogPosition.x + (dogRef.current.offsetWidth / 2) - (width / 2);
    const y = dogRect.bottom - 100;
    
    const levelSettings = GAME_LEVELS[currentLevel as keyof typeof GAME_LEVELS];
    const speed = levelSettings.speed * 0.65;

    const newPoop: PoopObject = {
      id,
      x,
      y,
      width,
      height,
      speed,
      type: 'poop',
      createdAt: Date.now(),
      onGround: false
    };
    
    setFallingObjects(prev => [...prev, newPoop]);
  };

  const updateFallingObjects = (deltaTime: number) => {
    const now = Date.now();
    
    setFallingObjects(prev => 
      prev
        .map(obj => {
          if (obj.type === 'poop') {
            const poop = obj as PoopObject;
            
            if (poop.onGround) {
              return poop;
            }
            
            if (obj.y >= (gameHeight - 120)) {
              return {
                ...obj,
                y: gameHeight - 120,
                onGround: true,
                createdAt: now
              };
            }
          }
          
          return {
            ...obj,
            y: obj.y + obj.speed * deltaTime
          };
        })
        .filter(obj => {
          if (obj.type === 'poop' && (obj as PoopObject).onGround) {
            return true;
          }
          return obj.y < (gameHeight + obj.height);
        })
    );
  };

  const checkCollisions = () => {
    if (!playerRef.current) return;

    const playerRect = playerRef.current.getBoundingClientRect();
    const playerX = playerRect.left;
    const playerY = playerRect.top;
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
      let poopCollected = false;

      for (const obj of prev) {
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
          } else if (obj.type === 'poop') {
            poopCollected = true;
            const poopPoints = hasDoublePoints ? POOP_POINT_VALUE * 2 : POOP_POINT_VALUE;
            scoreIncrement += poopPoints;
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
        setLives(l => Math.min(l + 1, 5));
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
      const invincibilityDuration = 5;
      
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
    const vodkaDuration = 8;
    
    if (controlsReversedTimeoutRef.current) {
      clearTimeout(controlsReversedTimeoutRef.current);
    }
    
    setAreControlsReversed(true);
    setControlsReversedTimeLeft(vodkaDuration);
    setIsVodkaActive(true);
    
    controlsReversedTimeoutRef.current = window.setTimeout(() => {
      setAreControlsReversed(false);
      setControlsReversedTimeLeft(0);
      setIsVodkaActive(false);
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

    setShowSheilaAnimation(true);
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
          {showSheilaAnimation && (
            <SheilaAnimation 
              gameWidth={gameWidth} 
              floorLevel={100}
              onComplete={() => setShowSheilaAnimation(false)} 
            />
          )}

          <div 
            ref={playerRef} 
            className={`player ${isInvincible ? 'invincible' : ''} ${hasDoublePoints ? 'double-points' : ''} ${isWalking ? 'walking' : ''} ${isHurt ? 'hurt' : ''} ${isEjecting ? 'ejecting' : ''} ${areControlsReversed ? 'drunk' : ''}`}
            style={{ 
              left: `${playerPosition.x}px`,
              bottom: `100px`,
              backgroundImage: isInvincible
                ? `url('/images/MuscleMartin.png')`
                : isVodkaActive 
                  ? `url('/images/martin_vodka.png')`
                  : `url('/images/Martin.png')`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              transform: playerDirection === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
              transition: 'transform 0.2s ease-out',
              width: isInvincible ? '108px' : '72px',
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
                      ? 'heart pulsing-heart'
                      : obj.type === 'vodka'
                        ? 'vodka'
                        : obj.type === 'poop'
                          ? 'poop'
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
                    : obj.type === 'heart'
                      ? `url('/images/heart.png')`
                      : obj.type === 'vodka'
                        ? `url('/images/vodka.webp')`
                        : obj.type === 'poop'
                          ? `url('/images/shit.png')`
                          : `url('/images/nuke.png')`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
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
                <img 
                  key={i} 
                  src="/images/heart.png" 
                  alt="Heart" 
                  className="mr-1" 
                  style={{ width: '20px', height: '20px' }} 
                />
              ))}
            </div>
            
            {isInvincible && (
              <div className="mt-2 w-full">
                <div className="flex items-center text-yellow-400 mb-1">
                  <Star size={16} className="mr-1" />
                  <span>Invincible: {Math.ceil(invincibilityTimeLeft)}s</span>
                </div>
              </div>
            )}
            
            {areControlsReversed && (
              <div className="mt-2 w-full">
                <div className="flex items-center text-red-400 mb-1">
                  <span>Controls reversed: {Math.ceil(controlsReversedTimeLeft)}s</span>
                </div>
              </div>
            )}
            
            <div className="player-name mt-2">
              <span>{playerName}</span>
            </div>
          </div>
          
          {!isMobile && (
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
          )}
          
          {isMobile && (
            <div className="touch-controls">
              <div 
                className="touch-area left-area"
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '50%',
                  height: '100%',
                  zIndex: 5,
                  opacity: 0
                }}
              />
              <div 
                className="touch-area right-area"
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: '50%',
                  height: '100%',
                  zIndex: 5,
                  opacity: 0
                }}
              />
            </div>
          )}
        </>
      )}
      
      <div className={`game-over ${isGameOver ? '' : 'hidden'}`}>
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl mb-2">Player: {playerName}</p>
        <p className="text-xl mb-6">Final Score: {score}</p>
        
        {highScores.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Trophy size={20} />
              <h3 className="text-xl font-bold">Leaderboard</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="w-12">Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell className="text-right">Score</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highScores.slice(0, 3).map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center">
                        <Medal size={18} color={getMedalColor(index)} fill={getMedalColor(index)} />
                      </div>
                    </TableCell>
                    <TableCell>{entry.playerName}</TableCell>
                    <TableCell className="text-right">{entry.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <Button onClick={resetGame} className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
          Play Again
        </Button>
      </div>
    </div>
  );
};

export default Game;
