import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import socketService from '../services/socketService';
import Game from '../components/Chessboard';
import GameDetails from '../components/GameInfo'; // Renamed from GameInfo
import Lobby from '../components/Lobby';
import TimeControlSelector from '../components/TimeControlSelector';
import { ethers } from 'ethers';
import type { GameInfo } from '../../../shared/types'; // Import shared GameInfo as a type
import './PlayPage.css';

interface PlayPageProps {
    chessGameContract: Contract | null;
    userAccount: string | null;
}

const PlayPage = ({ chessGameContract, userAccount }: PlayPageProps) => {
    const [gameId, setGameId] = useState<string | null>(null);
    const [status, setStatus] = useState('Welcome to Magnus Chess! Select a time control to create a new game or join an existing one.');
    const [gameOver, setGameOver] = useState('');
    const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
    const [lobbyGames, setLobbyGames] = useState<GameInfo[]>([]);
    const [currentStakes, setCurrentStakes] = useState(0);
    const [isCreatingGame, setIsCreatingGame] = useState(false);
    const [showTimeControlSelector, setShowTimeControlSelector] = useState(false);
    const [connectionState, setConnectionState] = useState(socketService.getConnectionState());

    // Monitor connection state
    useEffect(() => {
        const handleConnectionStateChange = (state: any) => {
            setConnectionState(state);
            if (state === 'connected') {
                socketService.emit('getLobby');
            }
        };

        socketService.onConnectionStateChange(handleConnectionStateChange);
        
        // Initial connection check
        if (socketService.isConnected()) {
            socketService.emit('getLobby');
        }

        return () => {
            socketService.offConnectionStateChange(handleConnectionStateChange);
        };
    }, []);

    const [selectedTime, setSelectedTime] = useState(5);
    const [selectedIncrement, setSelectedIncrement] = useState(0);

    const handleCreateGame = async (timeControl: number, increment: number, stakes: number) => {
        if (!chessGameContract || !userAccount) {
            setStatus('Please connect your wallet to create a game.');
            return;
        }

        if (!socketService.isConnected()) {
            setStatus('Connecting to server...');
            // The connection is now handled by App.tsx
            return;
        }

        setIsCreatingGame(true);
        setStatus('Creating game on the blockchain...');
        setSelectedTime(timeControl);
        setSelectedIncrement(increment);

        try {
            // Create game on blockchain first
            const dummyOpponent = "0x000000000000000000000000000000000000dEaD";
            const tx = await chessGameContract.createGame(userAccount, dummyOpponent);
            const receipt = await tx.wait();
            
            // Find the GameCreated event
            const gameCreatedEvent = receipt.logs.find((e: any) => 
                e.fragment && e.fragment.name === 'GameCreated'
            );
            
            if (gameCreatedEvent) {
                const newGameId = gameCreatedEvent.args.gameId.toString();
                
                // Create backend game room with the on-chain game ID
                socketService.emit('createGame', { 
                    walletAddress: userAccount,
                    timeControl: timeControl,
                    increment: increment,
                    onChainGameId: newGameId
                });
                
                // Set stakes for the game
                if (stakes > 0) {
                    socketService.emit('setStakes', { gameId: newGameId, amount: stakes });
                }
                setGameId(newGameId);
                setPlayerColor('white'); // Creator is always white initially
                setCurrentStakes(stakes);
                setStatus(`Game #${newGameId} created! Waiting for opponent to join...`);
                setShowTimeControlSelector(false);
            } else {
                setStatus("Could not find GameCreated event.");
            }
        } catch (error: any) {
            console.error('Error creating game:', error);
            setStatus(`Error creating game: ${error.message}`);
        } finally {
            setIsCreatingGame(false);
        }
    };

    const handleJoinFromLobby = (gameId: string) => {
        if (!userAccount) {
            setStatus('Please connect your wallet before joining a game.');
            return;
        }

        if (!socketService.isConnected()) {
            setStatus('Connecting to server...');
            // The connection is now handled by App.tsx
            return;
        }

        setGameId(gameId);
        socketService.emit('joinGame', { gameId: gameId, walletAddress: userAccount });
        setStatus(`Joining game ${gameId}...`);
    };

    const handleJoinAsSpectator = (gameId: string) => {
        if (!userAccount) {
            setStatus('Please connect your wallet to spectate.');
            return;
        }

        // Navigate to spectator page
        window.location.href = `/spectate/${gameId}`;
    };

    // Socket event listeners
    useEffect(() => {
        socketService.on('gameJoined', (data: { gameId: string; color: 'white' | 'black' }) => {
        setPlayerColor(data.color);
        setStatus(`Joined game ${data.gameId} as ${data.color}. ${data.color === 'white' ? 'You go first!' : 'Waiting for white to move...'}`);
    });

        socketService.on('error', (data: { message: string }) => {
        setStatus(`Error: ${data.message}`);
        if (data.message.includes('Wallet must be connected') || data.message.includes('Game is full')) {
            setGameId(null);
            setPlayerColor(null);
        }
    });

        socketService.on('gameState', (data: { gameId: string; players: { white: string; black: string } }) => {
        setStatus(`Game ${data.gameId} - ${data.players.white ? 'White joined' : 'Waiting for white'} | ${data.players.black ? 'Black joined' : 'Waiting for black'}`);
    });

        socketService.on('lobbyUpdate', (data: { games: GameInfo[] }) => {
        setLobbyGames(data.games);
    });

        socketService.on('stakesUpdated', (data: { amount: number }) => {
        setCurrentStakes(data.amount);
        setStatus('Stakes updated.');
    });

        socketService.on('gameCreated', (data: { gameId: string }) => {
            setStatus(`Game ${data.gameId} created successfully!`);
        });

        return () => {
            socketService.off('gameJoined');
            socketService.off('error');
            socketService.off('gameState');
            socketService.off('lobbyUpdate');
            socketService.off('stakesUpdated');
            socketService.off('gameCreated');
        };
    }, []);

    return (
        <div className="main-content">
            {gameId ? (
                <>
                    <Game 
                        socket={socketService.getSocket()}
                        gameId={gameId}
                        chessGameContract={chessGameContract} 
                        userAccount={userAccount} 
                        setStatus={setStatus}
                        setGameOver={setGameOver}
                        gameOver={gameOver}
                        playerColor={playerColor}
                        selectedTime={selectedTime}
                        selectedIncrement={selectedIncrement}
                        currentStakes={currentStakes}
                    />
                    <div className="side-panel">
                        <GameDetails 
                            gameId={parseInt(gameId)}
                            status={status}
                            gameOver={gameOver}
                            playerColor={playerColor}
                        />
                    </div>
                </>
            ) : (
                <div className="play-page-container">
                    <div className="page-header">
                        <h1>🎮 Magnus Chess Arena</h1>
                        <p>Challenge players, place bets, and compete for rewards!</p>
                        {connectionState !== 'connected' && (
                            <div className="connection-status">
                                <span className={`status-indicator ${connectionState}`}>
                                    {connectionState === 'connecting' && '🔄 Connecting...'}
                                    {connectionState === 'reconnecting' && '🔄 Reconnecting...'}
                                    {connectionState === 'error' && '❌ Connection Error'}
                                    {connectionState === 'disconnected' && '🔌 Disconnected'}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="content-sections">
                        {/* Active Games Lobby */}
                        <div className="lobby-section">
                            <div className="section-header">
                                <h2>🔥 Active Games</h2>
                                <button 
                                    className="refresh-btn"
                                    onClick={() => socketService.emit('getLobby')}
                                    disabled={!socketService.isConnected()}
                                >
                                    🔄 Refresh
                                </button>
                            </div>
                            
                        <Lobby 
                            games={lobbyGames}
                            onJoinGame={handleJoinFromLobby}
                            userAccount={userAccount}
                            />
                        </div>

                        {/* Game Creation Section */}
                        <div className="creation-section">
                            <div className="section-header">
                                <h2>🎯 Create New Game</h2>
                                <button 
                                    className={`toggle-btn ${showTimeControlSelector ? 'active' : ''}`}
                                    onClick={() => setShowTimeControlSelector(!showTimeControlSelector)}
                                >
                                    {showTimeControlSelector ? 'Hide' : 'Show'} Game Creator
                                </button>
                            </div>
                            
                            {showTimeControlSelector && (
                                <TimeControlSelector
                                    onGameCreate={handleCreateGame}
                                    isCreating={isCreatingGame}
                                />
                            )}
                        </div>
                    </div>

                    {/* Wallet Connection Warning */}
                    {!userAccount && (
                        <div className="wallet-warning-section">
                        <div className="wallet-warning">
                                <h3>⚠️ Wallet Required</h3>
                                <p>Please connect your wallet to create games, join matches, and place bets.</p>
                                <div className="warning-features">
                                    <span>🔐 Secure Transactions</span>
                                    <span>💰 Bet with STT Tokens</span>
                                    <span>🏆 Earn Rewards</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Display */}
                    <div className="status-section">
                        <div className="status-display">
                            <span className="status-icon">💬</span>
                            <span className="status-text">{status}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayPage;
