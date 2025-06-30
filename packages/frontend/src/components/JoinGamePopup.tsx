import React, { useState } from 'react';

interface JoinGamePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGame: (gameId: string) => void;
  suggestedGameId?: string;
}

const JoinGamePopup: React.FC<JoinGamePopupProps> = ({ 
  isOpen, 
  onClose, 
  onJoinGame, 
  suggestedGameId 
}) => {
  const [gameId, setGameId] = useState(suggestedGameId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameId.trim()) {
      onJoinGame(gameId.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setGameId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="join-game-popup-overlay">
      <div className="join-game-popup">
        <div className="join-game-popup-header">
          <h3>Join a Game</h3>
          <button className="close-button" onClick={handleCancel}>×</button>
        </div>
        
        <div className="join-game-popup-content">
          <p className="join-game-description">
            Enter the Game ID to join an existing game.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="game-id-input">
              <label htmlFor="gameId">Game ID:</label>
              <input
                id="gameId"
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="Enter Game ID..."
                autoFocus
                required
              />
            </div>
            
            <div className="join-game-popup-actions">
              <button 
                type="button"
                className="cancel-button" 
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="join-button" 
                disabled={!gameId.trim()}
              >
                Join Game
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinGamePopup; 