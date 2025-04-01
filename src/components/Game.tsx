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
  const [isTemporarilyImmune, setIsTemporarilyImmune] = useState<boolean>(false);
  const hurtTimeoutRef = useRef<number | null>(null);
  const temporaryImmunityTimeoutRef = useRef<number | null>(null);
  
  const [areControlsReversed, setAreControlsReversed] = useState<boolean>(false);
  const controlsReversedTimeoutRef = useRef<number | null>(null);
  const [controlsReversedTimeLeft, setControlsReversedTimeLeft] = useState<number>(0);

  const [playerName, setPlayerName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [savedScore, setSavedScore] = useState<boolean>(false);

  const [hasShownInitialAnimation, setHasShownInitialAnimation] = useState<boolean>(false);

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
      
      const timeSinceLastPowerUp = Date.now() - lastPowerUpTime.current;
      if (timeSinceLastPowerUp > 15000 && Math.random() < levelSettings.powerUpChance * deltaTime * 0.01) {
        createPowerUp();
        lastPowerUpTime.current = Date.now();
      }
      
      const timeSinceLastHeart = Date.now() - lastHeartSpawnTime.current;
      if (lives < 5 && timeSinceLastHeart > 10000 && Math.random() < levelSettings.heartChance * deltaTime * 0.01) {
        createHeart();
        lastHeartSpawnTime.current = Date.now();
      }
      
      const timeSinceLastVodka = Date.now() - lastVodkaSpawnTime.current;
      if (timeSinceLastVodka > 12000 && Math.random() < levelSettings.vodkaChance * deltaTime * 0.01) {
        createVodka();
        lastVodkaSpawnTime.current = Date.now();
      }
      
      const timeSinceLastPoop = Date.now() - lastPoopTime.current;
      if (timeSinceLastPoop > 5000 && Math.random() < levelSettings.poopChance * deltaTime * 0.01 && isDogWalking) {
        createPoop();
        lastPoopTime.current = Date.now();
      }
      
      const timeSinceLastAutoPoop = Date.now() - lastAutoPoopTime.current;
      if (timeSinceLastAutoPoop > AUTO_POOP_INTERVAL) {
        createPoop();
        lastAutoPoopTime.current = Date.now();
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
            if (!isInvincible && !isTemporarilyImmune) {
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

            setIsTemporarilyImmune(true);
            
            if (temporaryImmunityTimeoutRef.current) {
              clearTimeout(temporaryImmunityTimeoutRef.current);
            }
            
            temporaryImmunityTimeoutRef.current = window.setTimeout(() => {
              setIsTemporarilyImmune(false);
              temporaryImmunityTimeoutRef.current = null;
            }, 1000);
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
  };

  return (
    <div 
      ref={gameContainerRef}
      className={`relative w-full h-full overflow-hidden bg-cover bg-center`}
      style={{ backgroundImage: `url('/images/Background.webp')`, touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showNameModal ? (
        <PlayerNameModal onSubmit={handleNameSubmit} />
      ) : (
        <>
          <div className="absolute top-0 left-0 w-full p-2 flex justify-between items-center z-10">
            <div className="flex items-center gap-2 bg-black bg-opacity-70 text-white p-2 rounded-lg">
              <Coins className="text-yellow-400" size={20} />
              <span className="font-bold">{score}</span>
            </div>
            <div className="flex items-center gap-1 bg-black bg-opacity-70 text-white p-2 rounded-lg">
              {Array.from({ length: 5 }).map((_, i) => (
                <span 
                  key={i} 
                  className={`text-2xl ${i < lives ? 'text-red-500' : 'text-gray-600'}`}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-20 bg-[url('/images/MartinUIBackground.png')] bg-repeat-x bg-contain opacity-0" />

          {isInvincible && (
            <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg z-10">
              INVINCIBILITY: {invincibilityTimeLeft.toFixed(1)}s
            </div>
          )}
          
          {areControlsReversed && (
            <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg z-10">
              CONTROLS REVERSED: {controlsReversedTimeLeft.toFixed(1)}s
            </div>
          )}

          <div
            ref={playerRef}
            className={`absolute transition-transform duration-100 ${isHurt ? 'animate-shake' : ''}`}
            style={{
              left: `${playerPosition.x}px`,
              bottom: '100px',
              transform: `scaleX(${playerDirection === 'left' ? -1 : 1})`,
              width: '60px',
              height: '120px'
            }}
          >
            <img
              src={isMuscleMartin ? '/images/MuscleMartin.png' : areControlsReversed ? '/images/martin_vodka.png' : '/images/Martin.png'}
              alt="Player"
              className={`h-full w-auto object-contain ${isWalking ? 'animate-character-walk' : ''}`}
            />
          </div>

          <div
            ref={dogRef}
            style={{
              position: 'absolute',
              left: `${dogPosition.x}px`,
              bottom: '100px',
              transform: `scaleX(${dogPosition.direction === 'left' ? -1 : 1})`,
              width: '60px',
              height: '40px',
              zIndex: 5
            }}
          >
            <img
              src="/images/Dog.png"
              alt="Dog"
              className={`h-full w-auto object-contain ${isDogWalking ? 'animate-character-walk' : ''}`}
            />
          </div>

          {fallingObjects.map(obj => {
            let imageSrc = '';
            let className = '';
            
            if (obj.type === 'coin') {
              imageSrc = COIN_TYPES[obj.coinType].imagePath;
              className = 'animate-coin-spin';
            } else if (obj.type === 'obstacle') {
              imageSrc = '/images/lemon.webp';
              className = 'animate-drop-spin';
            } else if (obj.type === 'powerup') {
              imageSrc = '/images/nuke.png';
              className = 'animate-pulse';
            } else if (obj.type === 'heart') {
              imageSrc = '/images/heart.png';
              className = 'animate-pulse';
            } else if (obj.type === 'vodka') {
              imageSrc = '/images/vodka.webp';
              className = 'animate-vodka-wobble';
            } else if (obj.type === 'poop') {
              imageSrc = '/images/shit.png';
              className = (obj as PoopObject).onGround ? '' : 'animate-poop-fall';
            }
            
            return (
              <div
                key={obj.id}
                style={{
                  position: 'absolute',
                  left: `${obj.x}px`,
                  top: `${obj.y}px`,
                  width: `${obj.width}px`,
                  height: `${obj.height}px`,
                  zIndex: obj.type === 'poop' && (obj as PoopObject).onGround ? 4 : 10
                }}
              >
                <img
                  src={imageSrc}
                  alt={obj.type}
                  className={`w-full h-full object-contain ${className}`}
                />
              </div>
            );
          })}

          {isMobile && (
            <div className="fixed bottom-24 left-0 w-full flex justify-between px-4 z-20">
              <Button
                variant="outline"
                className="h-16 w-16 rounded-full bg-white opacity-60 flex items-center justify-center"
                onPointerDown={startMovingLeft}
                onPointerUp={stopMovingLeft}
                onPointerLeave={stopMovingLeft}
              >
                ←
              </Button>
              <Button
                variant="outline"
                className="h-16 w-16 rounded-full bg-white opacity-60 flex items-center justify-center"
                onPointerDown={startMovingRight}
                onPointerUp={stopMovingRight}
                onPointerLeave={stopMovingRight}
              >
                →
              </Button>
            </div>
          )}

          <div className={`game-over absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center transition-opacity opacity-0 duration-1000 ease-in-out ${isGameOver ? 'z-30' : '-z-10'}`}>
            <h1 className="text-4xl text-white font-bold mb-6">Game Over</h1>
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="text-yellow-400" size={24} />
              <span className="text-2xl text-white font-bold">{score}</span>
            </div>

            <div className="bg-white p-4 rounded-lg mb-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-2 text-center">Leaderboard</h2>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="font-bold">Rank</TableCell>
                    <TableCell className="font-bold">Name</TableCell>
                    <TableCell className="font-bold text-right">Score</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highScores.slice(0, 5).map((highScore, index) => (
                    <TableRow key={index} className={highScore.name === playerName && highScore.score === score ? 'bg-yellow-100' : ''}>
                      <TableCell>
                        {index === 0 ? (
                          <Medal className="text-yellow-500" size={18} />
                        ) : index === 1 ? (
                          <Medal className="text-gray-400" size={18} />
                        ) : index === 2 ? (
                          <Medal className="text-amber-600" size={18} />
                        ) : (
                          index + 1
                        )}
                      </TableCell>
                      <TableCell>{highScore.name}</TableCell>
                      <TableCell className="text-right">{highScore.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <Button onClick={resetGame} className="bg-green-600 hover:bg-green-700">
              Play Again
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Game;
