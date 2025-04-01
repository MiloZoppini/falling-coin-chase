
import { useState, useRef, useEffect } from 'react';
import { 
  FallingObject, CoinObject, ObstacleObject, PowerUpObject, 
  HeartObject, VodkaObject, PoopObject, SheilaObject, HammerObject 
} from '@/types/gameTypes';
import { 
  GAME_LEVELS, COIN_TYPES, POOP_POINT_VALUE, 
  POOP_WIDTH, POOP_HEIGHT, AUTO_POOP_INTERVAL, SHEILA_ENTRANCE_DELAY 
} from '@/constants/gameConstants';
import { getHighScores, saveHighScore, HighScore } from '@/services/supabaseService';

interface GameState {
  score: number;
  lives: number;
  isGameOver: boolean;
  playerPosition: { x: number; y: number };
  dogPosition: { x: number; direction: 'left' | 'right' };
  fallingObjects: FallingObject[];
  isPaused: boolean;
  playerDirection: 'left' | 'right';
  isWalking: boolean;
  isDogWalking: boolean;
  isEjecting: boolean;
  isVodkaActive: boolean;
  sheila: SheilaObject;
  hammer: HammerObject;
  currentLevel: number;
  isInvincible: boolean;
  invincibilityTimeLeft: number;
  hasDoublePoints: boolean;
  isHurt: boolean;
  areControlsReversed: boolean;
  controlsReversedTimeLeft: number;
  highScores: HighScore[];
  savedScore: boolean;
}

export const useGameLogic = (
  playerName: string,
  gameContainerRef: React.RefObject<HTMLDivElement>,
  playerRef: React.RefObject<HTMLDivElement>,
  dogRef: React.RefObject<HTMLDivElement>
) => {
  const [gameWidth, setGameWidth] = useState<number>(0);
  const [gameHeight, setGameHeight] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const lastPlayerPositionsRef = useRef<Array<{x: number, direction: 'left' | 'right'}>>([]);
  const gameLoopRef = useRef<number | null>(null);
  const invincibilityTimeoutRef = useRef<number | null>(null);
  const doublePointsTimeoutRef = useRef<number | null>(null);
  const hurtTimeoutRef = useRef<number | null>(null);
  const controlsReversedTimeoutRef = useRef<number | null>(null);
  const lastPowerUpTime = useRef<number>(0);
  const lastHeartSpawnTime = useRef<number>(0);
  const lastVodkaSpawnTime = useRef<number>(0);
  const lastPoopTime = useRef<number>(0);
  const lastAutoPoopTime = useRef<number>(Date.now());
  const gameStartTimeRef = useRef<number>(0);
  const sheilaEntranceTimeoutRef = useRef<number | null>(null);
  const keysPressed = useRef<{left: boolean, right: boolean}>({
    left: false,
    right: false
  });

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    isGameOver: false,
    playerPosition: { x: 0, y: 0 },
    dogPosition: { x: 0, direction: 'right' },
    fallingObjects: [],
    isPaused: false,
    playerDirection: 'right',
    isWalking: false,
    isDogWalking: false,
    isEjecting: false,
    isVodkaActive: false,
    sheila: {
      x: -100,
      y: 100,
      width: 72,
      height: 72,
      visible: false
    },
    hammer: {
      x: -150,
      y: 100,
      width: 50,
      height: 50,
      visible: false
    },
    currentLevel: 1,
    isInvincible: false,
    invincibilityTimeLeft: 0,
    hasDoublePoints: false,
    isHurt: false,
    areControlsReversed: false,
    controlsReversedTimeLeft: 0,
    highScores: [],
    savedScore: false
  });

  const playerSpeed = 5;

  // Load high scores
  useEffect(() => {
    const loadHighScores = async () => {
      const scores = await getHighScores();
      setGameState(prev => ({ ...prev, highScores: scores }));
    };
    
    loadHighScores();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameContainerRef.current) {
        const { width, height } = gameContainerRef.current.getBoundingClientRect();
        setGameWidth(width);
        setGameHeight(height);
        
        if (playerRef.current) {
          const playerWidth = playerRef.current.offsetWidth;
          setGameState(prev => ({
            ...prev,
            playerPosition: {
              x: width / 2 - playerWidth / 2,
              y: height - 100
            }
          }));
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

  // Save high score when game is over
  useEffect(() => {
    if (gameState.isGameOver && !gameState.savedScore && playerName) {
      const saveScore = async () => {
        await saveHighScore(playerName, gameState.score);
        setGameState(prev => ({ ...prev, savedScore: true }));
        
        const scores = await getHighScores();
        setGameState(prev => ({ ...prev, highScores: scores }));
      };
      
      saveScore();
    }
  }, [gameState.isGameOver, gameState.savedScore, playerName, gameState.score]);

  // Main game loop
  useEffect(() => {
    if (!playerName || gameState.isGameOver || gameState.isPaused) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }
    
    if (gameStartTimeRef.current === 0) {
      gameStartTimeRef.current = Date.now();
      
      sheilaEntranceTimeoutRef.current = window.setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          sheila: {
            ...prev.sheila,
            x: -100,
            visible: true
          },
          hammer: {
            ...prev.hammer,
            x: -150,
            visible: true
          }
        }));
        
        sheilaEntranceTimeoutRef.current = null;
      }, SHEILA_ENTRANCE_DELAY);
    }
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      if (deltaTime === 0) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      movePlayer();

      // Move sheila and hammer
      if (gameState.sheila.visible) {
        setGameState(prev => {
          const newSheilaX = prev.sheila.x + 2;
          const newHammerX = prev.hammer.x + 2;
          
          return {
            ...prev,
            sheila: {
              ...prev.sheila,
              x: newSheilaX > gameWidth + 100 ? -100 : newSheilaX
            },
            hammer: {
              ...prev.hammer,
              x: newHammerX > gameWidth + 100 ? -150 : newHammerX
            }
          };
        });
      }

      const levelSettings = GAME_LEVELS[gameState.currentLevel as keyof typeof GAME_LEVELS];
      
      // Create falling objects
      if (Math.random() < levelSettings.spawnRate * deltaTime * 0.1) {
        createFallingObject();
      }

      const now = Date.now();
      
      // Create power-ups
      const timeSinceLastPowerUp = now - lastPowerUpTime.current;
      if (timeSinceLastPowerUp > 15000 && Math.random() < levelSettings.powerUpChance * deltaTime * 0.01) {
        createPowerUp();
        lastPowerUpTime.current = now;
      }
      
      // Create hearts
      const timeSinceLastHeart = now - lastHeartSpawnTime.current;
      if (gameState.lives < 5 && timeSinceLastHeart > 10000 && Math.random() < levelSettings.heartChance * deltaTime * 0.01) {
        createHeart();
        lastHeartSpawnTime.current = now;
      }
      
      // Create vodka
      const timeSinceLastVodka = now - lastVodkaSpawnTime.current;
      if (timeSinceLastVodka > 12000 && Math.random() < levelSettings.vodkaChance * deltaTime * 0.01) {
        createVodka();
        lastVodkaSpawnTime.current = now;
      }
      
      // Create poop
      const timeSinceLastPoop = now - lastPoopTime.current;
      if (timeSinceLastPoop > 5000 && Math.random() < levelSettings.poopChance * deltaTime * 0.01 && gameState.isDogWalking) {
        createPoop();
        lastPoopTime.current = now;
      }
      
      // Auto-create poop
      const timeSinceLastAutoPoop = now - lastAutoPoopTime.current;
      if (timeSinceLastAutoPoop > AUTO_POOP_INTERVAL) {
        createPoop();
        lastAutoPoopTime.current = now;
      }

      updateFallingObjects(deltaTime);
      checkCollisions();

      // Update level
      const newLevel = Math.min(3, Math.floor(gameState.score / 1500) + 1);
      if (newLevel !== gameState.currentLevel) {
        setGameState(prev => ({ ...prev, currentLevel: newLevel }));
      }

      // Update invincibility timer
      if (gameState.isInvincible) {
        setGameState(prev => {
          const newTimeLeft = Math.max(0, prev.invincibilityTimeLeft - deltaTime / 1000);
          
          if (newTimeLeft <= 0 && invincibilityTimeoutRef.current) {
            clearTimeout(invincibilityTimeoutRef.current);
            invincibilityTimeoutRef.current = null;
            
            if (gameContainerRef.current) {
              gameContainerRef.current.classList.remove('earthquake');
            }
            
            return {
              ...prev,
              isInvincible: false,
              isMuscleMartin: false,
              invincibilityTimeLeft: 0
            };
          }
          
          return {
            ...prev,
            invincibilityTimeLeft: newTimeLeft
          };
        });
      }
      
      // Update reversed controls timer
      if (gameState.areControlsReversed) {
        setGameState(prev => {
          const newTimeLeft = Math.max(0, prev.controlsReversedTimeLeft - deltaTime / 1000);
          
          if (newTimeLeft <= 0 && controlsReversedTimeoutRef.current) {
            clearTimeout(controlsReversedTimeoutRef.current);
            controlsReversedTimeoutRef.current = null;
            
            return {
              ...prev,
              areControlsReversed: false,
              isVodkaActive: false,
              controlsReversedTimeLeft: 0
            };
          }
          
          return {
            ...prev,
            controlsReversedTimeLeft: newTimeLeft
          };
        });
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      
      if (sheilaEntranceTimeoutRef.current) {
        clearTimeout(sheilaEntranceTimeoutRef.current);
        sheilaEntranceTimeoutRef.current = null;
      }
    };
  }, [playerName, gameState.isGameOver, gameState.isPaused, gameWidth, gameHeight, gameState.score, 
      gameState.currentLevel, gameState.isEjecting, gameState.isInvincible, gameState.areControlsReversed, 
      gameState.isDogWalking, gameState.lives, gameState.sheila.visible]);

  // Update dog position based on player position
  useEffect(() => {
    lastPlayerPositionsRef.current.push({ 
      x: gameState.playerPosition.x, 
      direction: gameState.playerDirection 
    });
    
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
      
      setGameState(prev => ({
        ...prev,
        dogPosition: {
          x: dogX,
          direction: targetPosition.direction
        },
        isDogWalking: prev.isWalking
      }));
    }
  }, [gameState.playerPosition, gameState.playerDirection, gameState.isWalking]);

  // Function to move the player
  const movePlayer = () => {
    if (gameState.isEjecting) return;
    
    setGameState(prev => {
      const playerWidth = playerRef.current?.offsetWidth || 40;
      let newX = prev.playerPosition.x;
      let isMoving = false;
      let newDirection = prev.playerDirection;

      if (keysPressed.current.left && newX > 0) {
        newX = Math.max(0, newX - playerSpeed);
        newDirection = 'left';
        isMoving = true;
      }
      if (keysPressed.current.right && newX < gameWidth - playerWidth) {
        newX = Math.min(gameWidth - playerWidth, newX + playerSpeed);
        newDirection = 'right';
        isMoving = true;
      }

      return {
        ...prev,
        playerPosition: { ...prev.playerPosition, x: newX },
        playerDirection: newDirection,
        isWalking: isMoving
      };
    });
  };

  // Function to create falling objects
  const createFallingObject = () => {
    if (!gameWidth) return;

    const id = Date.now() + Math.random();
    const levelSettings = GAME_LEVELS[gameState.currentLevel as keyof typeof GAME_LEVELS];
    
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
      
      setGameState(prev => ({
        ...prev,
        fallingObjects: [...prev.fallingObjects, newCoin]
      }));
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
      
      setGameState(prev => ({
        ...prev,
        fallingObjects: [...prev.fallingObjects, newObstacle]
      }));
    }
  };

  // Function to create power-ups
  const createPowerUp = () => {
    if (!gameWidth) return;
    
    const id = Date.now() + Math.random();
    const width = 40;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[gameState.currentLevel as keyof typeof GAME_LEVELS];
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
    
    setGameState(prev => ({
      ...prev,
      fallingObjects: [...prev.fallingObjects, newPowerUp]
    }));
  };

  // Function to create hearts
  const createHeart = () => {
    if (!gameWidth) return;
    
    const id = Date.now() + Math.random();
    const width = 30;
    const height = 30;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[gameState.currentLevel as keyof typeof GAME_LEVELS];
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
    
    setGameState(prev => ({
      ...prev,
      fallingObjects: [...prev.fallingObjects, newHeart]
    }));
  };

  // Function to create vodka
  const createVodka = () => {
    if (!gameWidth) return;
    
    const id = Date.now() + Math.random();
    const width = 43;
    const height = 43;
    const x = Math.random() * (gameWidth - width);
    const levelSettings = GAME_LEVELS[gameState.currentLevel as keyof typeof GAME_LEVELS];
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
    
    setGameState(prev => ({
      ...prev,
      fallingObjects: [...prev.fallingObjects, newVodka]
    }));
  };

  // Function to create poop
  const createPoop = () => {
    if (!gameWidth || !dogRef.current) return;
    
    const dogRect = dogRef.current.getBoundingClientRect();
    const id = Date.now() + Math.random();
    const width = POOP_WIDTH;
    const height = POOP_HEIGHT;
    
    const x = gameState.dogPosition.x + (dogRef.current.offsetWidth / 2) - (width / 2);
    const y = dogRect.bottom - 100;
    
    const levelSettings = GAME_LEVELS[gameState.currentLevel as keyof typeof GAME_LEVELS];
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
    
    setGameState(prev => ({
      ...prev,
      fallingObjects: [...prev.fallingObjects, newPoop]
    }));
  };

  // Function to update falling objects
  const updateFallingObjects = (deltaTime: number) => {
    const now = Date.now();
    
    setGameState(prev => {
      const updatedObjects = prev.fallingObjects
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
              } as PoopObject;
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
        });
      
      return {
        ...prev,
        fallingObjects: updatedObjects
      };
    });
  };

  // Function to check collisions
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

    setGameState(prev => {
      const remaining = [];
      let scoreIncrement = 0;
      let lostLife = false;
      let powerupCollected = false;
      let powerupType: PowerUpObject['powerType'] | null = null;
      let heartCollected = false;
      let vodkaCollected = false;
      let poopCollected = false;

      for (const obj of prev.fallingObjects) {
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
            const pointsAwarded = prev.hasDoublePoints ? obj.pointValue * 2 : obj.pointValue;
            scoreIncrement += pointsAwarded;
          } else if (obj.type === 'obstacle') {
            if (!prev.isInvincible) {
              lostLife = true;
            }
          } else if (obj.type === 'powerup') {
            powerupCollected = true;
            powerupType = (obj as PowerUpObject).powerType;
          } else if (obj.type === 'heart') {
            heartCollected = true;
          } else if (obj.type === 'vodka') {
            vodkaCollected = true;
          } else if (obj.type === 'poop') {
            poopCollected = true;
            const poopPoints = prev.hasDoublePoints ? POOP_POINT_VALUE * 2 : POOP_POINT_VALUE;
            scoreIncrement += poopPoints;
          }
        } else {
          remaining.push(obj);
        }
      }

      let newState = { ...prev, fallingObjects: remaining };
      
      if (scoreIncrement > 0) {
        newState.score += scoreIncrement;
      }
      
      if (lostLife) {
        const newLives = prev.lives - 1;
        newState.lives = newLives;
        
        if (!prev.isHurt) {
          newState.isHurt = true;
          
          if (hurtTimeoutRef.current) {
            clearTimeout(hurtTimeoutRef.current);
          }
          
          hurtTimeoutRef.current = window.setTimeout(() => {
            setGameState(state => ({ ...state, isHurt: false }));
          }, 900);
        }
        
        if (newLives <= 0) {
          newState.isEjecting = true;
          keysPressed.current.left = false;
          keysPressed.current.right = false;
          newState.isWalking = false;
          newState.isGameOver = true;
          
          setTimeout(() => {
            const gameOverElement = document.querySelector('.game-over');
            if (gameOverElement) {
              gameOverElement.classList.add('visible');
            }
          }, 0);
        }
      }
      
      if (heartCollected) {
        newState.lives = Math.min(prev.lives + 1, 5);
      }
      
      if (powerupCollected && powerupType) {
        handlePowerUp(powerupType);
      }
      
      if (vodkaCollected) {
        handleVodkaEffect();
      }

      return newState;
    });
  };

  // Function to handle power-ups
  const handlePowerUp = (powerType: PowerUpObject['powerType']) => {
    if (powerType === 'invincibility') {
      const invincibilityDuration = 5;
      
      if (invincibilityTimeoutRef.current) {
        clearTimeout(invincibilityTimeoutRef.current);
      }
      
      setGameState(prev => ({
        ...prev,
        isInvincible: true,
        isMuscleMartin: true,
        invincibilityTimeLeft: invincibilityDuration
      }));
      
      if (gameContainerRef.current) {
        gameContainerRef.current.classList.add('earthquake');
      }
      
      invincibilityTimeoutRef.current = window.setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          isInvincible: false,
          isMuscleMartin: false,
          invincibilityTimeLeft: 0
        }));
        
        if (gameContainerRef.current) {
          gameContainerRef.current.classList.remove('earthquake');
        }
        
        invincibilityTimeoutRef.current = null;
      }, invincibilityDuration * 1000);
    }
  };
  
  // Function to handle vodka effect
  const handleVodkaEffect = () => {
    const vodkaDuration = 8;
    
    if (controlsReversedTimeoutRef.current) {
      clearTimeout(controlsReversedTimeoutRef.current);
    }
    
    setGameState(prev => ({
      ...prev,
      areControlsReversed: true,
      controlsReversedTimeLeft: vodkaDuration,
      isVodkaActive: true
    }));
    
    controlsReversedTimeoutRef.current = window.setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        areControlsReversed: false,
        controlsReversedTimeLeft: 0,
        isVodkaActive: false
      }));
      
      controlsReversedTimeoutRef.current = null;
    }, vodkaDuration * 1000);
  };

  // Function to handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState.isGameOver || gameState.isEjecting) return;
    
    const touchX = e.touches[0].clientX;
    const centerX = window.innerWidth / 2;
    
    keysPressed.current.left = false;
    keysPressed.current.right = false;
    
    if (gameState.areControlsReversed) {
      if (touchX >= centerX) {
        keysPressed.current.left = true;
        setGameState(prev => ({ ...prev, playerDirection: 'left' }));
      } else {
        keysPressed.current.right = true;
        setGameState(prev => ({ ...prev, playerDirection: 'right' }));
      }
    } else {
      if (touchX < centerX) {
        keysPressed.current.left = true;
        setGameState(prev => ({ ...prev, playerDirection: 'left' }));
      } else {
        keysPressed.current.right = true;
        setGameState(prev => ({ ...prev, playerDirection: 'right' }));
      }
    }
    
    setGameState(prev => ({ ...prev, isWalking: true }));
  };

  // Function to handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState.isGameOver || gameState.isEjecting) return;
    
    const touchX = e.touches[0].clientX;
    const centerX = window.innerWidth / 2;
    
    keysPressed.current.left = false;
    keysPressed.current.right = false;
    
    if (gameState.areControlsReversed) {
      if (touchX >= centerX) {
        keysPressed.current.left = true;
        setGameState(prev => ({ ...prev, playerDirection: 'left' }));
      } else {
        keysPressed.current.right = true;
        setGameState(prev => ({ ...prev, playerDirection: 'right' }));
      }
    } else {
      if (touchX < centerX) {
        keysPressed.current.left = true;
        setGameState(prev => ({ ...prev, playerDirection: 'left' }));
      } else {
        keysPressed.current.right = true;
        setGameState(prev => ({ ...prev, playerDirection: 'right' }));
      }
    }
  };

  // Function to handle touch end
  const handleTouchEnd = () => {
    keysPressed.current.left = false;
    keysPressed.current.right = false;
    setGameState(prev => ({ ...prev, isWalking: false }));
  };

  // Function to start moving left
  const startMovingLeft = () => {
    if (!gameState.isGameOver && !gameState.isEjecting) {
      keysPressed.current.left = true;
      setGameState(prev => ({ 
        ...prev, 
        playerDirection: 'left',
        isWalking: true
      }));
    }
  };

  // Function to stop moving left
  const stopMovingLeft = () => {
    keysPressed.current.left = false;
    if (!keysPressed.current.right) {
      setGameState(prev => ({ ...prev, isWalking: false }));
    }
  };

  // Function to start moving right
  const startMovingRight = () => {
    if (!gameState.isGameOver && !gameState.isEjecting) {
      keysPressed.current.right = true;
      setGameState(prev => ({ 
        ...prev, 
        playerDirection: 'right',
        isWalking: true
      }));
    }
  };

  // Function to stop moving right
  const stopMovingRight = () => {
    keysPressed.current.right = false;
    if (!keysPressed.current.left) {
      setGameState(prev => ({ ...prev, isWalking: false }));
    }
  };

  // Function to reset the game
  const resetGame = () => {
    setGameState({
      score: 0,
      lives: 3,
      isGameOver: false,
      playerPosition: { x: gameWidth / 2 - 36, y: gameHeight - 100 },
      dogPosition: { x: 0, direction: 'right' },
      fallingObjects: [],
      isPaused: false,
      playerDirection: 'right',
      isWalking: false,
      isDogWalking: false,
      isEjecting: false,
      isVodkaActive: false,
      sheila: {
        x: -100,
        y: 100,
        width: 72,
        height: 72,
        visible: false
      },
      hammer: {
        x: -150,
        y: 100,
        width: 50,
        height: 50,
        visible: false
      },
      currentLevel: 1,
      isInvincible: false,
      invincibilityTimeLeft: 0,
      hasDoublePoints: false,
      isHurt: false,
      areControlsReversed: false,
      controlsReversedTimeLeft: 0,
      highScores: gameState.highScores,
      savedScore: false
    });
    
    gameStartTimeRef.current = 0;
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

  return {
    gameState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    startMovingLeft,
    stopMovingLeft,
    startMovingRight,
    stopMovingRight,
    resetGame
  };
};
