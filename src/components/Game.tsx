
import React, { useRef } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import PlayerNameModal from './PlayerNameModal';
import Player from './game/Player';
import Dog from './game/Dog';
import BackgroundElements from './game/BackgroundElements';
import FallingObject from './game/FallingObject';
import GameStats from './game/GameStats';
import GameOver from './game/GameOver';
import Controls from './game/Controls';
import { useGameLogic } from '@/hooks/useGameLogic';

const Game: React.FC = () => {
  const isMobile = useIsMobile();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const dogRef = useRef<HTMLDivElement>(null);
  
  const [playerName, setPlayerName] = React.useState<string>('');
  const [showNameModal, setShowNameModal] = React.useState<boolean>(true);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    setShowNameModal(false);
  };

  const {
    gameState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    startMovingLeft,
    stopMovingLeft,
    startMovingRight,
    stopMovingRight,
    resetGame
  } = useGameLogic(playerName, gameContainerRef, playerRef, dogRef);

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
          <BackgroundElements 
            sheila={gameState.sheila}
            hammer={gameState.hammer}
          />
          
          <div ref={playerRef}>
            <Player 
              position={gameState.playerPosition}
              isInvincible={gameState.isInvincible}
              isVodkaActive={gameState.isVodkaActive}
              isWalking={gameState.isWalking}
              isHurt={gameState.isHurt}
              isEjecting={gameState.isEjecting}
              areControlsReversed={gameState.areControlsReversed}
              direction={gameState.playerDirection}
            />
          </div>
          
          <div ref={dogRef}>
            <Dog 
              position={gameState.dogPosition}
              isWalking={gameState.isDogWalking}
              isEjecting={gameState.isEjecting}
            />
          </div>
          
          {gameState.fallingObjects.map((obj) => (
            <FallingObject key={obj.id} object={obj} />
          ))}
          
          <GameStats 
            score={gameState.score}
            currentLevel={gameState.currentLevel}
            lives={gameState.lives}
            isInvincible={gameState.isInvincible}
            invincibilityTimeLeft={gameState.invincibilityTimeLeft}
            areControlsReversed={gameState.areControlsReversed}
            controlsReversedTimeLeft={gameState.controlsReversedTimeLeft}
            playerName={playerName}
          />
          
          <Controls 
            isMobile={isMobile}
            startMovingLeft={startMovingLeft}
            stopMovingLeft={stopMovingLeft}
            startMovingRight={startMovingRight}
            stopMovingRight={stopMovingRight}
          />
        </>
      )}
      
      <GameOver 
        isGameOver={gameState.isGameOver}
        playerName={playerName}
        score={gameState.score}
        highScores={gameState.highScores}
        onPlayAgain={resetGame}
      />
    </div>
  );
};

export default Game;
