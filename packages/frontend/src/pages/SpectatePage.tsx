import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Contract } from 'ethers';
import { io } from 'socket.io-client';
import { Chessboard } from 'react-chessboard';
import SpectatorBetting from '../components/SpectatorBetting';
import GameChat from '../components/GameChat';
import './SpectatePage.css';

// Define the structure of the game state
interface GameState {
    players: { white: string; black: string };
    moveHistory: any[]; // Consider using a more specific type if possible
    timers: { white: number; black: number; activePlayer: 'white' | 'black' | null; timeControl: number };
    stakes: { amount: number };
    isFinished: boolean;
    totalWhiteBets: number;
    totalBlackBets: number;
    betsLocked: boolean;
    fen: string;
}

interface SpectatePageProps {
    chessGameContract: Contract | null;
    userAccount: string | null;
    isConnected: boolean;
}

const SpectatePage: React.FC<SpectatePageProps> = ({
    chessGameContract,
    userAccount,
    isConnected
}) => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const socket = io(import.meta.env.VITE_BACKEND_URL);

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [showBetting, setShowBetting] = useState<boolean>(true);
    const [gameOver, setGameOver] = useState<string | null>(null);

    useEffect(() => {
        if (!gameId) {
            navigate('/play');
            return;
        }

        socket.emit('joinGame', gameId);

        socket.on('gameNotFound', () => {
            navigate('/play');
        });

        socket.on('gameState', (data) => {
            setGameState(prev => prev ? { ...prev, ...data } : data);
        });

        socket.on('gameOver', (data) => {
            setGameOver(data.reason);
            setGameState(prev => prev ? { ...prev, isFinished: true } : null);
        });

        return () => {
            socket.emit('leaveGame', gameId);
            socket.off('gameNotFound');
            socket.off('gameState');
            socket.off('gameOver');
        };
    }, [gameId, navigate, socket]);

    const formatAddress = (address: string) => {
        return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '...';
    };

    const formatTime = (timeMs: number): string => {
        const minutes = Math.floor(timeMs / 60000);
        const seconds = Math.floor((timeMs % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!gameState) {
        return <div className="loading-container">Loading game...</div>;
    }

    return (
        <div className="spectate-page-container">
            <div className="spectate-main-content">
                <header className="spectate-header">
                    <h1>Spectating Game</h1>
                    <div className="player-info-bar">
                        <div className="player white">
                            <span className="piece">♔</span>
                            <span className="name">{formatAddress(gameState.players.white)}</span>
                            <span className="timer">{formatTime(gameState.timers.white)}</span>
                        </div>
                        <div className="vs">VS</div>
                        <div className="player black">
                            <span className="piece">♚</span>
                            <span className="name">{formatAddress(gameState.players.black)}</span>
                            <span className="timer">{formatTime(gameState.timers.black)}</span>
                        </div>
                    </div>
                </header>

                <div className="chessboard-container">
                    <Chessboard
                        position={gameState.fen}
                        arePiecesDraggable={false}
                        boardWidth={560}
                    />
                </div>

                <div className="move-history">
                    <h3>Move History</h3>
                    <div className="moves">
                        {gameState.moveHistory.map((move, index) => (
                            <div key={index} className="move">
                                <span>{index + 1}.</span> {move.san}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <aside className="spectate-sidebar">
                <div className="sidebar-toggle">
                    <button onClick={() => setShowBetting(!showBetting)}>
                        {showBetting ? 'Hide Betting' : 'Show Betting'}
                    </button>
                </div>

                {showBetting && (
                    <SpectatorBetting
                        gameId={gameId!}
                        chessGameContract={chessGameContract}
                        userAccount={userAccount}
                        totalWhiteBets={gameState.totalWhiteBets}
                        totalBlackBets={gameState.totalBlackBets}
                        betsLocked={gameState.betsLocked}
                    />
                )}

                <GameChat
                    socket={socket}
                    gameId={gameId!}
                    userAccount={userAccount}
                    userType="spectator"
                    isConnected={isConnected}
                />
            </aside>
        </div>
    );
};

export default SpectatePage;
