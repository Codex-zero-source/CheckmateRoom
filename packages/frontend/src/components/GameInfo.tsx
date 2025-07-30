import type { FC } from 'react';

interface GameInfoProps {
    gameId: number | null;
    status: string;
    gameOver: string;
    playerColor: 'white' | 'black' | null;
}

const GameDetails: FC<GameInfoProps> = ({ gameId, status, gameOver, playerColor }) => {
    return (
        <div className="game-info">
            <h3>Game Status</h3>
            <div className="info-item">
                <span className="info-label">Game ID:</span>
                <span className="info-value mono">{gameId !== null ? `#${gameId}` : 'N/A'}</span>
            </div>
            <div className="info-item">
                <span className="info-label">Your Color:</span>
                <span className="info-value mono">
                    {playerColor ? (
                        <span className={`color-indicator ${playerColor}`}>
                            {playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}
                        </span>
                    ) : 'Not assigned'}
                </span>
            </div>
            <div className="info-item">
                <span className="info-label">Last Action:</span>
                <span className="info-value mono">{status || 'Waiting for game to start...'}</span>
            </div>
            {gameOver && (
                <div className="info-item game-over-info">
                    <span className="info-label">Result:</span>
                    <span className="info-value mono">{gameOver}</span>
                </div>
            )}
        </div>
    );
};

export default GameDetails;
