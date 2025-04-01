
import React from 'react';

interface ControlsProps {
  isMobile: boolean;
  startMovingLeft: () => void;
  stopMovingLeft: () => void;
  startMovingRight: () => void;
  stopMovingRight: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isMobile,
  startMovingLeft,
  stopMovingLeft,
  startMovingRight,
  stopMovingRight
}) => {
  return (
    <>
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
  );
};

export default Controls;
