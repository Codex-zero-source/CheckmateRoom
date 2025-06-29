import { useState } from 'react';
import { Contract } from 'ethers';
import Game from '../components/Chessboard';
import GameInfo from '../components/GameInfo';
import TimeControl from '../components/TimeControl';
import Lobby from '../components/Lobby';
import StakesControl from '../components/StakesControl';
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

interface PlayPageProps {
    chessGameContract: Contract | null;
    userAccount: string | null;
}

interface GameInfo {
  gameId: string;
  whitePlayer: string | null;
  blackPlayer: string | null;
  stakes: number;
  timeControl: number;
  increment: number;
  isFull: boolean;
  isStarted: boolean;
}

const PlayPage = ({ chessGameContract, userAccount }: PlayPageProps) => {
    const [gameId, setGameId] = useState<string | null>(null);
    const [status, setStatus] = useState('Enter a game ID to join or start a new game.');
    const [gameOver, setGameOver] = useState('');
    const [gameIdInput, setGameIdInput] = useState('');
    const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
    const [selectedTime, setSelectedTime] = useState(5); // Default 5 minutes
    const [selectedIncrement, setSelectedIncrement] = useState(0); // Default 0 seconds increment
    const [lobbyGames, setLobbyGames] = useState<GameInfo[]>([]);
    const [showLobby, setShowLobby] = useState(false);
    const [currentStakes, setCurrentStakes] = useState(0);

    const handleStartNewGame = () => {
        socket.emit('requestNewGameId');
    };

    const handleJoinGame = () => {
        if (!userAccount) {
            setStatus('Please connect your wallet before joining a game.');
            return;
        }

        if (gameIdInput) {
            setGameId(gameIdInput);
            socket.emit('joinGame', { gameId: gameIdInput, walletAddress: userAccount });
            setStatus(`Joining game ${gameIdInput}...`);
        }
    };

    const handleJoinFromLobby = (gameId: string) => {
        setGameIdInput(gameId);
        handleJoinGame();
        setShowLobby(false);
    };

    const handleTimeControlChange = (minutes: number, increment: number = 0) => {
        setSelectedTime(minutes);
        setSelectedIncrement(increment);
        if (gameId) {
            socket.emit('setTimeControl', { gameId, timeControl: minutes, increment });
        }
    };

    const handleStakesChange = (amount: number) => {
        setCurrentStakes(amount);
        if (gameId) {
            socket.emit('setStakes', { gameId, amount });
        }
    };

    const toggleLobby = () => {
        if (!showLobby) {
            socket.emit('getLobby');
        }
        setShowLobby(!showLobby);
    };

    // Listen for game join responses
    socket.on('gameJoined', (data) => {
        setPlayerColor(data.color);
        setStatus(`Joined game ${data.gameId} as ${data.color}. ${data.color === 'white' ? 'You go first!' : 'Waiting for white to move...'}`);
    });

    socket.on('error', (data) => {
        setStatus(`Error: ${data.message}`);
        if (data.message.includes('Wallet must be connected') || data.message.includes('Game is full')) {
            setGameId(null);
            setPlayerColor(null);
        }
    });

    socket.on('gameState', (data) => {
        setStatus(`Game ${data.gameId} - ${data.players.white ? 'White joined' : 'Waiting for white'} | ${data.players.black ? 'Black joined' : 'Waiting for black'}`);
    });

    socket.on('timeControlUpdated', (data) => {
        setStatus('Time control updated.');
    });

    // Listen for new game ID from server
    socket.on('newGameId', (data) => {
        setGameIdInput(data.gameId);
        setStatus(`New game ID generated: ${data.gameId}`);
    });

    socket.on('lobbyUpdate', (data) => {
        setLobbyGames(data.games);
    });

    socket.on('stakesUpdated', (data) => {
        setCurrentStakes(data.amount);
        setStatus('Stakes updated.');
    });

    return (
        <div className="main-content">
            {gameId ? (
                <>
                    <Game 
                        socket={socket}
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
                        <GameInfo 
                            gameId={parseInt(gameId)}
                            status={status}
                            gameOver={gameOver}
                            playerColor={playerColor}
                        />
                        <StakesControl
                            onStakesChange={handleStakesChange}
                            currentStakes={currentStakes}
                            gameId={gameId}
                        />
                    </div>
                </>
            ) : (
                <div className="join-game-container">
                    <h2>Join a Game</h2>
                    <div className="game-controls">
                        <button onClick={handleStartNewGame} className="game-button">
                            Start New Game (Generate ID)
                        </button>
                        <button onClick={toggleLobby} className="game-button">
                            {showLobby ? 'Hide Lobby' : 'Show Active Games'}
                        </button>
                    </div>
                    
                    {showLobby && (
                        <Lobby 
                            games={lobbyGames}
                            onJoinGame={handleJoinFromLobby}
                            userAccount={userAccount}
                        />
                    )}
                    
                    {!userAccount ? (
                        <div className="wallet-warning">
                            <p>⚠️ Please connect your wallet to join a game</p>
                        </div>
                    ) : (
                        <>
                            <TimeControl 
                                onTimeControlChange={handleTimeControlChange}
                                selectedTime={selectedTime}
                                selectedIncrement={selectedIncrement}
                            />
                            <StakesControl
                                onStakesChange={handleStakesChange}
                                currentStakes={currentStakes}
                                gameId={null}
                            />
                            <input 
                                type="text" 
                                placeholder="Enter Game ID" 
                                value={gameIdInput}
                                onChange={(e) => setGameIdInput(e.target.value)}
                            />
                            <button onClick={handleJoinGame}>Join Game</button>
                        </>
                    )}
                    <p>{status}</p>
                </div>
            )}
        </div>
    );
};

export default PlayPage; 