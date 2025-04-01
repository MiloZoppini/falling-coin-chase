import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Coins, Heart, Star, Trophy, Medal } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
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

type FallingObject = CoinObject | ObstacleObject | PowerUpObject;

const GAME_LEVELS = {
  1: { speed: 0.2, spawnRate: 0.02, obstacleRate: 0.3, powerUpChance: 0.02 },
  2: { speed: 0.3, spawnRate: 0.03, obstacleRate: 0.4, powerUpChance: 0.015 },
  3: { speed: 0.4, spawnRate: 0.04, obstacleRate: 0.5, powerUpChance: 0.01 }
};

const COIN_TYPES = {
  bitcoin: { imagePath: '/images/bitcoin.png', pointValue: 500, width: 30, height: 30, probability: 0.4 },
  moneycash: { imagePath: '/images/moneycash.png', pointValue: 100, width: 40, height: 26, probability: 0.35 },
  saccosoldi: { imagePath: '/images/saccosoldi.png', pointValue: 200, width: 36, height: 36, probability: 0.25 }
};

// Fixing the component declaration - making sure it returns JSX
const Game: React.FC = () => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [playerX, setPlayerX] = useState(50);
  const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [isInvincible, setIsInvincible] = useState(false);
  const [doublePoints, setDoublePoints] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isEjecting, setIsEjecting] = useState(false);
  const [isHurt, setIsHurt] = useState(false);
  const [isEarthquake, setIsEarthquake] = useState(false);

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const dogRef = useRef<HTMLDivElement>(null);
  const lastMoveTimeRef = useRef<number>(0);

  const isMobile = useIsMobile();
  const { toast } = useToast();

  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const playerWidth = 72;
  const playerHeight = 72;
  const dogWidth = 40;
  const dogHeight = 40;

  const localStorageKey = 'highScores';

  useEffect(() => {
    const storedName = localStorage.getItem('playerName');
    if (storedName) {
      setPlayerName(storedName);
      setShowModal(false);
    }
  }, []);

  useEffect(() => {
    if (playerName) {
      localStorage.setItem('playerName', playerName);
    }
  }, [playerName]);

  useEffect(() => {
    const fetchHighScoresFromSupabase = async () => {
      try {
        const scores = await getHighScores();
        setHighScores(scores);
      } catch (error) {
        console.error("Failed to fetch high scores from Supabase:", error);
      }
    };

    fetchHighScoresFromSupabase();
  }, []);

  useEffect(() => {
    const gameLoop = () => {
      if (!isGameOver) {
        updateFallingObjects();
        checkCollisions();
        updateLevel();
      }
    };

    const intervalId = setInterval(gameLoop, 16); // roughly 60fps

    return () => clearInterval(intervalId);
  }, [score, level, playerX, fallingObjects, isGameOver, isInvincible, doublePoints]);

  useEffect(() => {
    const spawnObject = () => {
      if (!isGameOver) {
        const randomObjectType = Math.random();
        let newObject: FallingObject;

        if (randomObjectType < GAME_LEVELS[level].spawnRate) {
          // Spawn a coin
          const coinTypeRoll = Math.random();
          let selectedCoinType: 'bitcoin' | 'moneycash' | 'saccosoldi' = 'bitcoin';
          let cumulativeProbability = 0;

          for (const coinType in COIN_TYPES) {
            cumulativeProbability += COIN_TYPES[coinType as keyof typeof COIN_TYPES].probability;
            if (coinTypeRoll < cumulativeProbability) {
              selectedCoinType = coinType as 'bitcoin' | 'moneycash' | 'saccosoldi';
              break;
            }
          }

          newObject = {
            id: Date.now(),
            x: Math.random() * (canvasWidth - COIN_TYPES[selectedCoinType].width),
            y: 0,
            width: COIN_TYPES[selectedCoinType].width,
            height: COIN_TYPES[selectedCoinType].height,
            speed: GAME_LEVELS[level].speed,
            type: 'coin',
            coinType: selectedCoinType,
            pointValue: COIN_TYPES[selectedCoinType].pointValue,
          };
        } else if (randomObjectType < GAME_LEVELS[level].spawnRate + GAME_LEVELS[level].obstacleRate) {
          // Spawn an obstacle
          newObject = {
            id: Date.now(),
            x: Math.random() * (canvasWidth - 40),
            y: 0,
            width: 40,
            height: 40,
            speed: GAME_LEVELS[level].speed,
            type: 'obstacle',
          };
        } else if (Math.random() < GAME_LEVELS[level].powerUpChance) {
          // Spawn a power-up
          newObject = {
            id: Date.now(),
            x: Math.random() * (canvasWidth - 30),
            y: 0,
            width: 30,
            height: 30,
            speed: GAME_LEVELS[level].speed,
            type: 'powerup',
            powerType: 'invincibility',
          };
        } else {
          return; // Don't spawn anything
        }

        setFallingObjects(prevObjects => [...prevObjects, newObject]);
      }
    };

    const spawnIntervalId = setInterval(spawnObject, 75);

    return () => clearInterval(spawnIntervalId);
  }, [level, canvasWidth, isGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMobile) return;

      if (e.key === 'ArrowLeft') {
        setDirection('left');
        setIsWalking(true);
      } else if (e.key === 'ArrowRight') {
        setDirection('right');
        setIsWalking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setDirection(null);
        setIsWalking(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMobile]);

  useEffect(() => {
    if (direction) {
      const movePlayer = () => {
        setPlayerX(prevX => {
          let newX = prevX;
          if (direction === 'left') {
            newX -= 8;
          } else if (direction === 'right') {
            newX += 8;
          }

          // Keep player within bounds
          if (newX < 0) {
            newX = 0;
          } else if (newX > canvasWidth - playerWidth) {
            newX = canvasWidth - playerWidth;
          }

          return newX;
        });
      };

      const currentTime = Date.now();
      if (currentTime - lastMoveTimeRef.current > 16) {
        movePlayer();
        lastMoveTimeRef.current = currentTime;
      }
    }
  }, [direction, canvasWidth, playerWidth]);

  const handleLeftButtonTouchStart = () => {
    setDirection('left');
    setIsWalking(true);
  };

  const handleRightButtonTouchStart = () => {
    setDirection('right');
    setIsWalking(true);
  };

  const handleControlButtonTouchEnd = () => {
    setDirection(null);
    setIsWalking(false);
  };

  const updateFallingObjects = () => {
    setFallingObjects(prevObjects =>
      prevObjects.map(obj => ({ ...obj, y: obj.y + obj.speed }))
    );
  };

  const checkCollisions = () => {
    const playerRect = {
      x: playerX,
      y: canvasHeight - playerHeight - 100,
      width: playerWidth,
      height: playerHeight,
    };

    fallingObjects.forEach(obj => {
      const objectRect = {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
      };

      if (
        playerRect.x < objectRect.x + objectRect.width &&
        playerRect.x + playerRect.width > objectRect.x &&
        playerRect.y < objectRect.y + objectRect.height &&
        playerRect.y + playerRect.height > objectRect.y
      ) {
        // Collision detected
        if (obj.type === 'coin') {
          setScore(prevScore => prevScore + (doublePoints ? obj.pointValue * 2 : obj.pointValue));
          setFallingObjects(prevObjects => prevObjects.filter(o => o.id !== obj.id));
        } else if (obj.type === 'obstacle') {
          setFallingObjects(prevObjects => prevObjects.filter(o => o.id !== obj.id));
          if (!isInvincible) {
            setLives(prevLives => {
              if (prevLives - 1 <= 0) {
                handleGameOver();
                return 0;
              } else {
                triggerHurtEffect();
                return prevLives - 1;
              }
            });
          }
        } else if (obj.type === 'powerup') {
          setFallingObjects(prevObjects => prevObjects.filter(o => o.id !== obj.id));
          if (obj.powerType === 'invincibility') {
            activateInvincibility();
          }
        }
      } else if (obj.y > canvasHeight) {
        // Object fell off screen
        setFallingObjects(prevObjects => prevObjects.filter(o => o.id !== obj.id));
      }
    });
  };

  const updateLevel = () => {
    if (score >= level * 5000 && level < Object.keys(GAME_LEVELS).length) {
      setLevel(prevLevel => prevLevel + 1);
      toast({
        title: "Level Up!",
        description: `Reached level ${level + 1}`,
      });
    }
  };

  const activateInvincibility = () => {
    setIsInvincible(true);
    toast({
      title: "Invincibility!",
      description: "You are now invincible for 5 seconds!",
    });
    playerRef.current?.classList.add('invincible');

    setTimeout(() => {
      setIsInvincible(false);
      playerRef.current?.classList.remove('invincible');
      toast({
        title: "Invincibility ended",
        description: "You are no longer invincible!",
      });
    }, 5000);
  };

  const triggerHurtEffect = () => {
    setIsHurt(true);
    setIsEarthquake(true);
    playerRef.current?.classList.add('hurt');
    gameContainerRef.current?.classList.add('earthquake');

    setTimeout(() => {
      setIsHurt(false);
      setIsEarthquake(false);
      playerRef.current?.classList.remove('hurt');
      gameContainerRef.current?.classList.remove('earthquake');
    }, 1500);
  };

  const handleGameOver = async () => {
    setIsGameOver(true);
    setIsEjecting(true);
    setIsWalking(false);
    setDirection(null);
    playerRef.current?.classList.add('ejecting');
    dogRef.current?.classList.add('ejecting');

    setTimeout(async () => {
      playerRef.current?.classList.remove('ejecting');
      dogRef.current?.classList.remove('ejecting');
      let newHighScores = [...highScores];

      if (playerName) {
        try {
          await saveHighScore(playerName, score);
          const updatedHighScores = await getHighScores();
          setHighScores(updatedHighScores);
          newHighScores = updatedHighScores;
        } catch (error) {
          console.error("Failed to save high score to Supabase:", error);
        }
      }

      setIsEjecting(false);
    }, 2500);
  };

  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    setPlayerX(50);
    setFallingObjects([]);
    setIsGameOver(false);
    setIsInvincible(false);
    setDoublePoints(false);
    setIsWalking(false);
    setDirection(null);
  };

  const handlePlayerNameSubmit = (name: string) => {
    setPlayerName(name);
    setShowModal(false);
  };

  const getMedal = (index: number) => {
    if (index === 0) return <Medal color="hsl(var(--foreground))" size={20} />;
    if (index === 1) return <Medal color="hsl(var(--foreground))" size={16} />;
    if (index === 2) return <Medal color="hsl(var(--foreground))" size={12} />;
    return null;
  };

  return (
    <div className="game-container" ref={gameContainerRef}>
      <div className="game-stats">
        <p>
          <Coins className="inline-block mr-1" size={20} />
          Score: {score}
        </p>
        <p>
          <Star className="inline-block mr-1" size={20} />
          Level: {level}
        </p>
        <p>
          <Heart className="inline-block mr-1" size={20} />
          Lives: {lives}
        </p>
      </div>

      <div
        className={`player ${isInvincible ? 'invincible' : ''} ${isWalking ? 'walking' : ''} ${isHurt ? 'hurt' : ''}`}
        style={{
          left: `${playerX}px`,
          transform: `translateX(-50%) scaleX(${direction === 'left' ? '-1' : '1'})`,
        }}
        ref={playerRef}
      >
        <img src="/images/player.gif" alt="Player" style={{ width: '100%', height: '100%' }} />
      </div>

      <div
        className={`dog ${isWalking ? 'walking' : ''}`}
        style={{
          left: `${playerX}px`,
          transform: `translateX(-50%) scaleX(${direction === 'left' ? '-1' : '1'})`,
        }}
        ref={dogRef}
      >
        <img src="/images/dog.gif" alt="Dog" style={{ width: '100%', height: '100%' }} />
      </div>

      {fallingObjects.map(object => {
        if (object.type === 'coin') {
          return (
            <div
              key={object.id}
              className="coin"
              style={{
                left: `${object.x}px`,
                top: `${object.y}px`,
                width: `${object.width}px`,
                height: `${object.height}px`,
              }}
            >
              <img src={COIN_TYPES[object.coinType].imagePath} alt="Coin" style={{ width: '100%', height: '100%' }} />
            </div>
          );
        } else if (object.type === 'obstacle') {
          return (
            <div
              key={object.id}
              className="obstacle"
              style={{
                left: `${object.x}px`,
                top: `${object.y}px`,
                width: `${object.width}px`,
                height: `${object.height}px`,
                backgroundColor: 'hsl(var(--obstacle-color))',
                borderRadius: '10px',
              }}
            />
          );
        } else if (object.type === 'powerup') {
          return (
            <div
              key={object.id}
              className={`powerup powerup-${object.powerType}`}
              style={{
                left: `${object.x}px`,
                top: `${object.y}px`,
                width: `${object.width}px`,
                height: `${object.height}px`,
              }}
            />
          );
        }
        return null;
      })}

      {isGameOver && (
        <div className={`game-over ${isGameOver ? 'visible' : ''}`}>
          <h2>Game Over!</h2>
          <p>Your Score: {score}</p>
          <div>
            <h3>High Scores</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {highScores.slice(0, 5).map((score, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{getMedal(index)} {index + 1}</TableCell>
                    <TableCell>{score.playerName}</TableCell>
                    <TableCell>{score.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button variant="minecraft" onClick={resetGame} disabled={isEjecting}>
            {isEjecting ? 'Ejecting...' : 'Play Again'}
          </Button>
        </div>
      )}

      {isMobile && (
        <div className="mobile-controls">
          <button
            className="control-button left-button"
            onTouchStart={handleLeftButtonTouchStart}
            onTouchEnd={handleControlButtonTouchEnd}
            onTouchCancel={handleControlButtonTouchEnd}
          >
            &lt;
          </button>
          <button
            className="control-button right-button"
            onTouchStart={handleRightButtonTouchStart}
            onTouchEnd={handleControlButtonTouchEnd}
            onTouchCancel={handleControlButtonTouchEnd}
          >
            &gt;
          </button>
        </div>
      )}

      <PlayerNameModal show={showModal} onSubmit={handlePlayerNameSubmit} />
    </div>
  );
};

export default Game;
