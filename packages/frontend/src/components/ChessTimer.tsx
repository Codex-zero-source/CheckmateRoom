import React from 'react';

interface ChessTimerProps {
  whiteTime: number; // Time in milliseconds
  blackTime: number;
  activePlayer: 'white' | 'black' | null;
  playerColor: 'white' | 'black' | null;
}

const ChessTimer: React.FC<ChessTimerProps> = ({
  whiteTime,
  blackTime,
  activePlayer,
  playerColor
}) => {
  const formatTime = (timeMs: number): string => {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // When less than 1 minute, show seconds with tenths
      const tenths = Math.floor((timeMs % 1000) / 100);
      return `${seconds}.${tenths}`;
    }
  };

  const getTimerClass = (color: 'white' | 'black') => {
    let baseClass = 'chess-timer';
    const timeMs = color === 'white' ? whiteTime : blackTime;
    
    if (activePlayer === color) {
      baseClass += ' active';
    }
    
    if (color === playerColor) {
      baseClass += ' own-timer';
    }
    
    // Add warning class when time is running low
    if (timeMs <= 30000) { // 30 seconds or less
      baseClass += ' warning';
    }
    
    if (timeMs <= 10000) { // 10 seconds or less
      baseClass += ' critical';
    }
    
    return baseClass;
  };

  return (
    <div className="chess-timers">
      <div className="timer-container">
        <div className={`timer ${getTimerClass('black')}`}>
          <div className="timer-label">Black</div>
          <div className="timer-display">{formatTime(blackTime)}</div>
        </div>
      </div>
      
      <div className="timer-container">
        <div className={`timer ${getTimerClass('white')}`}>
          <div className="timer-label">White</div>
          <div className="timer-display">{formatTime(whiteTime)}</div>
        </div>
      </div>
    </div>
  );
};

export default ChessTimer; 