
import React from 'react';

interface MobileControlsProps {
  startMovingLeft: () => void;
  stopMovingLeft: () => void;
  startMovingRight: () => void;
  stopMovingRight: () => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({
  startMovingLeft,
  stopMovingLeft,
  startMovingRight,
  stopMovingRight
}) => {
  return (
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
  );
};

export default MobileControls;
