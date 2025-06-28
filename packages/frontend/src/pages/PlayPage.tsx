import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Contract } from 'ethers';
import Game from '../components/Chessboard';
import GameInfo from '../components/GameInfo';
import TimeControl from '../components/TimeControl';
import Lobby from '../components/Lobby';
import StakesControl from '../components/StakesControl';
import { useWalletError } from '../contexts/WalletErrorContext';
import socket from '../services/socket';
import StakesPopup from '../components/StakesPopup';
import Pot from '../components/Pot';
import JoinGamePopup from '../components/JoinGamePopup';
import { ethers } from 'ethers';
import ChatBot from '../components/ChatBot';

// A dummy opponent for demonstration purposes
const DUMMY_OPPONENT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

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
    const { setWalletError } = useWalletError();
    const [gameId, setGameId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Welcome to Magnus Chess! Connect your wallet to start playing.');
    const [gameOver, setGameOver] = useState<string>('');
    const [gameIdInput, setGameIdInput] = useState<string>('');
    const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
    const [selectedTime, setSelectedTime] = useState<number>(5);
    const [selectedIncrement, setSelectedIncrement] = useState<number>(0);
    const [lobbyGames, setLobbyGames] = useState<GameInfo[]>([]);
    const [showLobby, setShowLobby] = useState<boolean>(false);
    const [currentStakes, setCurrentStakes] = useState<number>(0);
    const [showStakesPopup, setShowStakesPopup] = useState<boolean>(false);
    const [stakesLocked, setStakesLocked] = useState<boolean>(false);
    const [showJoinGamePopup, setShowJoinGamePopup] = useState<boolean>(false);
    const [moveHistory, setMoveHistory] = useState<Array<{
      move: string;
      notation: string;
      player: 'white' | 'black';
      timestamp: number;
    }>>([]);

    const handleStartNewGame = async () => {
        if (!userAccount) {
            setStatus('Please connect your wallet to create a new game.');
            setWalletError('Wallet must be connected to create a game');
            return;
        }
        
        // Show stakes popup first
        setShowStakesPopup(true);
    };

    const handleJoinGameClick = () => {
        setShowJoinGamePopup(true);
    };

    const handleJoinGameFromPopup = (gameId: string) => {
        setGameIdInput(gameId);
        handleJoinGame();
    };

    const handleCreateGameWithStakes = async (stakesAmount: number) => {
        if (!chessGameContract) {
            setStatus('Smart contract not connected. Please try again.');
            return;
        }
        
        setStatus('Creating game on the blockchain...');
        setWalletError(null);
        
        try {
            // 1. Call the smart contract to create game on-chain
            const tx = await chessGameContract.createGame(userAccount, DUMMY_OPPONENT_ADDRESS);
            const receipt = await tx.wait();
            
            // 2. Parse the GameCreated event to get the new game ID
            const gameCreatedEvent = receipt.logs.find((e: any) => 
                e.fragment && e.fragment.name === 'GameCreated'
            );
            
            if (gameCreatedEvent) {
                const newGameId = gameCreatedEvent.args.gameId.toString();
                
                // 3. Emit socket event to create backend game room with the on-chain game ID
                socket.emit('createGame', { 
                    walletAddress: userAccount,
                    timeControl: selectedTime,
                    increment: selectedIncrement,
                    onChainGameId: newGameId
                });
                
                // 4. Set stakes for the game
                setCurrentStakes(stakesAmount);
                socket.emit('setStakes', { gameId: newGameId, amount: stakesAmount });
                
                setStatus(`Game #${newGameId} created on-chain with ${ethers.formatEther(stakesAmount)} $MAG stakes! Waiting for opponent...`);
            } else {
                setStatus('Game created but could not find GameCreated event.');
            }
        } catch (error) {
            console.error('Error creating game on-chain:', error);
            setStatus('Error creating game on-chain. Please try again.');
            setWalletError('Failed to create game on blockchain');
        }
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

    const checkTokenBalance = async (requiredAmount: number): Promise<boolean> => {
        if (!chessGameContract || !userAccount) {
            return false;
        }
        
        try {
            // Get the MagnusToken contract address from the ChessGame contract
            const tokenAddress = await chessGameContract.magnusToken();
            
            // Create MagnusToken contract instance
            const magnusTokenContract = new ethers.Contract(
                tokenAddress,
                ['function balanceOf(address owner) view returns (uint256)'],
                chessGameContract.runner
            );
            
            // Check balance
            const balance = await magnusTokenContract.balanceOf(userAccount);
            return balance >= requiredAmount;
        } catch (error) {
            console.error('Error checking token balance:', error);
            return false;
        }
    };

    const handleJoinFromLobby = (gameId: string) => {
        setGameIdInput(gameId);
        // Find the game in lobby and set its time control
        const game = lobbyGames.find(g => g.gameId === gameId);
        if (game) {
            setSelectedTime(game.timeControl);
            setSelectedIncrement(game.increment);
        }
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

    socket.on('stakesUpdated', (data) => {
        setCurrentStakes(data.amount);
        setStatus('Stakes updated.');
    });

    // Listen for game join responses
    socket.on('gameJoined', (data) => {
        setPlayerColor(data.color);
        if (data.timeControl) {
            const timeInMinutes = data.timeControl / (60 * 1000);
            setSelectedTime(timeInMinutes);
        }
        setStatus(`Joined game ${data.gameId} as ${data.color}. ${data.color === 'white' ? 'You go first!' : 'Waiting for white to move...'}`);
    });

    socket.on('error', (data) => {
        setStatus(`Error: ${data.message}`);
        if (data.message.includes('Wallet must be connected') || data.message.includes('Game is full')) {
            setGameId(null);
            setPlayerColor(null);
        }
        // Handle insufficient tokens error
        if (data.type === 'insufficient_tokens') {
            setWalletError('Insufficient $MAG tokens to join this game');
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

    // Listen for game creation success
    socket.on('gameCreated', (data) => {
        setGameId(data.gameId);
        setPlayerColor(data.color);
        setStatus(`Game ${data.gameId} created successfully! You are playing as ${data.color}.`);
    });

    // Listen for game creation errors
    socket.on('gameCreationError', (data) => {
        if (data.type === 'wallet_required') {
            setStatus('Wallet must be connected to create a game. Please connect your wallet first.');
            setWalletError('Wallet must be connected to create a game');
        } else {
            setStatus(`Error creating game: ${data.message}`);
            setWalletError(data.message);
        }
    });

    socket.on('lobbyUpdate', (data) => {
        setLobbyGames(data.games);
    });

    socket.on('moveMade', (data) => {
        // Lock stakes on first move
        if (data.moveHistory && data.moveHistory.length === 1) {
            setStakesLocked(true);
        }
        // Update move history
        if (data.moveHistory) {
            setMoveHistory(data.moveHistory);
        }
    });

    const handleBetSuggestion = (amount: number) => {
        setStatus(`ChatBot suggests betting ${amount} MAG!`);
    };

    // Listen for token balance check request
    socket.on('checkTokenBalance', async (data) => {
        const { gameId, requiredAmount, walletAddress } = data;
        
        // Show ChatBot message about checking balance
        setWalletError('Checking your token balance...');
        
        const hasEnoughTokens = await checkTokenBalance(requiredAmount);
        
        if (hasEnoughTokens) {
            // Confirm to backend that player has enough tokens
            socket.emit('tokenBalanceConfirmed', { 
                gameId, 
                walletAddress, 
                hasEnoughTokens: true 
            });
            setWalletError(null);
        } else {
            // Notify backend that player doesn't have enough tokens
            socket.emit('tokenBalanceConfirmed', { 
                gameId, 
                walletAddress, 
                hasEnoughTokens: false 
            });
            // ChatBot will show sassy message via the error event
        }
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
                        <Pot 
                            amount={currentStakes}
                            isLocked={stakesLocked}
                        />
                        <StakesControl
                            onStakesChange={handleStakesChange}
                            currentStakes={currentStakes}
                            gameId={gameId}
                        />
                    </div>
                    <ChatBot 
                        gameState={{
                            isGameActive: !!gameId && !!playerColor,
                            currentStakes,
                            playerColor,
                            gameOver,
                            moveCount: moveHistory.length
                        }}
                        onBetSuggestion={handleBetSuggestion}
                        moveHistory={moveHistory}
                    />
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
                            <button 
                                onClick={() => setShowJoinGamePopup(true)} 
                                className="game-button"
                            >
                                Join Game
                            </button>
                        </>
                    )}
                    <p>{status}</p>
                </div>
            )}
            
            <StakesPopup
                isOpen={showStakesPopup}
                onClose={() => setShowStakesPopup(false)}
                onConfirm={handleCreateGameWithStakes}
                currentStakes={currentStakes}
            />
            
            <JoinGamePopup
                isOpen={showJoinGamePopup}
                onClose={() => setShowJoinGamePopup(false)}
                onJoinGame={handleJoinGame}
                suggestedGameId={gameIdInput}
            />
        </div>
    );
};

export default PlayPage; 