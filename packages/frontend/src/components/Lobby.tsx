import React from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import './Lobby.css';

interface GameInfo {
  gameId: string;
  whitePlayer: string | null;
  blackPlayer: string | null;
  stakes: number;
  timeControl: number;
  increment: number;
  isFull: boolean;
  isStarted: boolean;
  spectatorCount?: number;
}

interface LobbyProps {
  games: GameInfo[];
  onJoinGame: (gameId: string) => void;
  userAccount: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ games, onJoinGame, userAccount }) => {
  const navigate = useNavigate();

  const formatStakes = (stakes: number): string => {
    if (stakes === 0) return 'No stakes';
    return `${stakes} MAG`;
  };

  const formatAddress = (address: string | null): string => {
    if (!address) return 'Waiting...';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const canJoinGame = (game: GameInfo): boolean => {
    if (!userAccount) return false;
    if (game.isFull) return false;
    if (game.isStarted) return false;
    if (game.whitePlayer === userAccount || game.blackPlayer === userAccount) return false;
    return true;
  };

  const canSpectateGame = (game: GameInfo): boolean => {
    if (!userAccount) return false;
    if (game.whitePlayer === userAccount || game.blackPlayer === userAccount) return false;
    return true;
  };

  const handleSpectateGame = (gameId: string) => {
    navigate(`/spectate/${gameId}`);
  };

  return (
    <div className="lobby">
      <h3>🎮 Active Games</h3>
      {games.length === 0 ? (
        <p className="no-games">No active games. Create a new game to get started!</p>
      ) : (
        <div className="games-list">
          {games.map((game) => (
            <div key={game.gameId} className="game-item">
              <div className="game-header">
                <span className="game-id">Game #{game.gameId}</span>
                <span className={`game-status ${game.isStarted ? 'started' : 'waiting'}`}>
                  {game.isStarted ? '🔥 In Progress' : '⏳ Waiting for Players'}
                </span>
                {game.spectatorCount && game.spectatorCount > 0 && (
                  <span className="spectator-count">
                    👁️ {game.spectatorCount} watching
                  </span>
                )}
              </div>
              
              <div className="game-details">
                <div className="players">
                  <div className="player">
                    <span className="color white">♔ White:</span>
                    <span className="address">{formatAddress(game.whitePlayer)}</span>
                  </div>
                  <div className="player">
                    <span className="color black">♚ Black:</span>
                    <span className="address">{formatAddress(game.blackPlayer)}</span>
                  </div>
                </div>
                
                <div className="game-info">
                  <div className="info-item">
                    <span className="label">⏱️ Time Control:</span>
                    <span className="value">
                      {game.timeControl} min{game.increment > 0 ? ` + ${game.increment}s` : ''}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">💰 Stakes:</span>
                    <span className="value">{formatStakes(game.stakes)}</span>
                  </div>
                </div>
              </div>
              
              <div className="game-actions">
              {canJoinGame(game) && (
                <button 
                  className="join-game-btn"
                  onClick={() => onJoinGame(game.gameId)}
                >
                    🎯 Join Game
                  </button>
                )}
                
                {canSpectateGame(game) && (
                  <button 
                    className="spectate-game-btn"
                    onClick={() => handleSpectateGame(game.gameId)}
                  >
                    👁️ Spectate
                </button>
              )}
              
                {!canJoinGame(game) && !canSpectateGame(game) && game.isFull && (
                  <span className="game-full">🎮 You're Playing</span>
                )}
                
                {!canJoinGame(game) && canSpectateGame(game) && game.isFull && (
                  <span className="game-full">🎮 Game Full</span>
              )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Lobby; 