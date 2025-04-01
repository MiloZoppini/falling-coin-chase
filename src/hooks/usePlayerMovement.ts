
import { useRef, useState, useEffect } from 'react';

interface PlayerMovementProps {
  gameWidth: number;
  isGameOver: boolean;
}

export const usePlayerMovement = ({ gameWidth, isGameOver }: PlayerMovementProps) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const playerDirection = useRef<'left' | 'right'>('right');
  const [playerPosition, setPlayerPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const keysPressed = useRef<{left: boolean, right: boolean}>({
    left: false,
    right: false
  });
  
  const playerSpeed = 5;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        keysPressed.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        keysPressed.current.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        keysPressed.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        keysPressed.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOver]);

  const movePlayer = () => {
    if (!playerRef.current) return;
    
    setPlayerPosition(prev => {
      const playerWidth = playerRef.current?.offsetWidth || 64;
      let newX = prev.x;

      if (keysPressed.current.left && newX > 0) {
        newX = Math.max(0, newX - playerSpeed);
        playerDirection.current = 'left';
      }
      if (keysPressed.current.right && newX < gameWidth - playerWidth) {
        newX = Math.min(gameWidth - playerWidth, newX + playerSpeed);
        playerDirection.current = 'right';
      }

      // Update player sprite direction
      if (playerRef.current) {
        playerRef.current.style.transform = playerDirection.current === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
      }

      return { ...prev, x: newX };
    });
  };

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
      const playerWidth = playerRef.current?.offsetWidth || 64;
      const newX = Math.max(0, Math.min(gameWidth - playerWidth, prev.x + diffX));
      
      // Update player direction based on movement
      if (diffX < 0) {
        playerDirection.current = 'left';
        if (playerRef.current) playerRef.current.style.transform = 'scaleX(-1)';
      } else if (diffX > 0) {
        playerDirection.current = 'right';
        if (playerRef.current) playerRef.current.style.transform = 'scaleX(1)';
      }
      
      return { ...prev, x: newX };
    });
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = null;
  };

  const startMovingLeft = () => {
    if (!isGameOver) keysPressed.current.left = true;
  };

  const stopMovingLeft = () => {
    keysPressed.current.left = false;
  };

  const startMovingRight = () => {
    if (!isGameOver) keysPressed.current.right = true;
  };

  const stopMovingRight = () => {
    keysPressed.current.right = false;
  };

  return {
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
    stopMovingRight,
    keysPressed
  };
};
