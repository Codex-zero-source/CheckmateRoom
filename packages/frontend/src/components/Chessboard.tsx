import { useMemo, useState, useEffect } from 'react';
import type { FC, Dispatch, SetStateAction } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Contract } from 'ethers';
import { Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ChessTimer from './ChessTimer';
import MoveHistory from './MoveHistory';
import ChatBot from './ChatBot';
import StakesPopup from './StakesPopup';
import { ethers } from 'ethers';

// Explicitly type the Chessboard component to resolve the JSX issue
const ChessboardComponent: FC<any> = Chessboard as any;

interface GameProps {
  socket: Socket | null;
  gameId: string;
  chessGameContract: Contract | null;
  userAccount: string | null;
  setStatus: Dispatch<SetStateAction<string>>;
  setGameOver: Dispatch<SetStateAction<string>>;
  gameOver: string;
  playerColor: 'white' | 'black' | null;
  selectedTime: number;
  selectedIncrement: number;
  currentStakes: bigint;
  isSpectator?: boolean;
}

// A dummy opponent for demonstration purposes
const DUMMY_OPPONENT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export default function Game({ 
  socket,
  gameId,
  chessGameContract, 
  userAccount, 
  setStatus, 
  setGameOver, 
  gameOver,
  playerColor,
  selectedTime,
  selectedIncrement,
  currentStakes,
  isSpectator = false
}: GameProps) {
  const { pieceSet, boardTheme } = useTheme();
  const navigate = useNavigate();
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);
  const [whiteTime, setWhiteTime] = useState(selectedTime * 60 * 1000); // Use selected time control
  const [blackTime, setBlackTime] = useState(selectedTime * 60 * 1000);
  const [activePlayer, setActivePlayer] = useState<'white' | 'black' | null>(null);
  const [moveHistory, setMoveHistory] = useState<Array<{
    move: string;
    notation: string;
    player: 'white' | 'black';
    timestamp: number;
  }>>([]);
  const [showStakesPopup, setShowStakesPopup] = useState<boolean>(false);
  const [showDrawOffer, setShowDrawOffer] = useState<boolean>(false);
  const [drawOfferFrom, setDrawOfferFrom] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('gameState', (data) => {
      setFen(data.fen);
      game.load(data.fen);
    });

    socket.on('moveMade', (data) => {
      setFen(data.fen);
      game.load(data.fen);
      
      if (data.isGameOver) {
        const result = game.isCheckmate() ? 'Checkmate!' : 
                      game.isDraw() ? 'Draw!' : 
                      game.isStalemate() ? 'Stalemate!' : 
                      game.isThreefoldRepetition() ? 'Draw by repetition!' : 
                      game.isInsufficientMaterial() ? 'Draw by insufficient material!' : 
                      'Game Over!';
        
        const winner = game.isCheckmate() ? 
          (game.turn() === 'w' ? 'black' : 'white') : null;
        
        setGameOver(result);
        setWinner(winner);
        setActivePlayer(null);
      }
    });

    socket.on('timerUpdate', (data) => {
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
      setActivePlayer(data.activePlayer);
    });

    socket.on('gameOver', (data) => {
      setGameOver(data.reason);
      setWinner(data.winner);
      setActivePlayer(null);
    });

    socket.on('betsLocked', (data) => {
      setStatus('Bets locked! Game is now active.');
      // The timer will start automatically from the backend
    });

    socket.on('error', (data) => {
        setStatus(data.message);
    });

    socket.on('timeControlUpdated', (data) => {
        // Update timer display to match the game's time control
        setWhiteTime(data.timeControl);
        setBlackTime(data.timeControl);
    });

    socket.on('gameJoined', (data) => {
        // Update timer display to match the game's time control when joining
        if (data.timeControl) {
            setWhiteTime(data.timeControl);
            setBlackTime(data.timeControl);
        }
    });

    socket.on('drawOffered', (data) => {
        setDrawOfferFrom(data.offeredBy);
        setShowDrawOffer(true);
        setStatus(`${data.offeredBy} has offered a draw`);
    });

    socket.on('drawDeclined', (data) => {
        setShowDrawOffer(false);
        setDrawOfferFrom(null);
        setStatus(`${data.declinedBy} declined the draw offer`);
    });

    socket.on('gameEnd', (data) => {
        setShowDrawOffer(false);
        setDrawOfferFrom(null);
        setGameOver(data.reason);
        setWinner(data.winner);
        setActivePlayer(null);
    });

    return () => {
      socket.off('gameState');
      socket.off('moveMade');
      socket.off('timerUpdate');
      socket.off('gameOver');
      socket.off('betsLocked');
      socket.off('error');
      socket.off('timeControlUpdated');
      socket.off('gameJoined');
      socket.off('drawOffered');
      socket.off('drawDeclined');
      socket.off('gameEnd');
    }
  }, [socket, game, setStatus, setGameOver, setWinner]);

  // Update timer values when selected time control changes
  useEffect(() => {
    const timeInMs = selectedTime * 60 * 1000;
    setWhiteTime(timeInMs);
    setBlackTime(timeInMs);
  }, [selectedTime]);

  const handleStartGame = async () => {
    if (!chessGameContract || !userAccount) {
      alert("Please connect your wallet first.");
      return;
    }
    // Show stakes popup first
    setShowStakesPopup(true);
  };

  const handleCreateGameWithStakes = async (stakesAmount: bigint) => {
    if (!chessGameContract || !userAccount || !socket) {
      alert("Please connect your wallet first.");
      return;
    }
    setStatus("Creating game on the blockchain...");
    try {
      const tx = await chessGameContract.createGame(userAccount, DUMMY_OPPONENT_ADDRESS);
      const receipt = await tx.wait();
      const gameCreatedEvent = receipt.logs.find((e: any) => e.fragment && e.fragment.name === 'GameCreated');
      
      if (gameCreatedEvent) {
        const newGameId = gameCreatedEvent.args.gameId.toString();
        // Emit socket event to create backend game room with the on-chain game ID
        socket.emit('createGame', { 
          walletAddress: userAccount,
          timeControl: selectedTime,
          increment: selectedIncrement,
          onChainGameId: newGameId
        });
        
        // Set stakes for the game
        socket.emit('setStakes', { gameId: newGameId, amount: stakesAmount.toString() });
        
        setStatus(`Game #${newGameId} created on-chain with ${ethers.formatEther(stakesAmount)} STT stakes! Share this ID with your opponent.`);
        game.reset();
        setFen(game.fen());
        setGameOver('');
        setWinner(null);
        // Reset timer to selected time control
        const timeInMs = selectedTime * 60 * 1000;
        setWhiteTime(timeInMs);
        setBlackTime(timeInMs);
        setActivePlayer(null);
      } else {
        setStatus("Could not find GameCreated event.");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      setStatus("Error creating game. See console for details.");
    }
  };
  
  const handleClaimReward = async () => {
    if (!chessGameContract || !userAccount || !gameOver) {
      alert("Cannot claim reward at this time.");
      return;
    }

    try {
      setStatus("Claiming reward on the blockchain...");
      
      // Get the PGN from the game
      const pgn = game.pgn();
      
      // Determine winner based on game over state
      let winnerAddress = userAccount;
      // This logic needs to be updated to get the opponent's address from the game state
      // For now, we'll just use the user's address as the winner

      const tx = await chessGameContract.reportWinner(gameId, winnerAddress, pgn);
      await tx.wait();
      
      setStatus(`Reward claimed successfully! Winner: ${winnerAddress}`);
    } catch (error) {
      console.error("Error claiming reward:", error);
      setStatus("Error claiming reward. Please try again.");
    }
  };

  const handlePlaceBet = async (amount: bigint, color: 'white' | 'black') => {
    if (!chessGameContract || !userAccount || !socket) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      setStatus("Placing bet on the blockchain...");
      
      // Place the bet on the smart contract
      const isWhite = color === 'white';
      const betTx = await chessGameContract.placeBet(gameId, isWhite, { value: amount });
      await betTx.wait();
      
      // Emit socket event to update backend
      socket.emit('placeBet', { gameId, walletAddress: userAccount, color });
      
      setStatus(`Bet of ${ethers.formatEther(amount)} STT placed successfully for ${color}!`);
    } catch (error) {
      console.error("Error placing bet:", error);
      setStatus("Error placing bet. Please try again.");
    }
  };

  const handleLockBets = async () => {
    if (!chessGameContract || !userAccount || !socket) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      setStatus("Locking bets on the blockchain...");
      
      const tx = await chessGameContract.lockBets(gameId);
      await tx.wait();
      
      // Emit socket event to update backend
      socket.emit('lockBets', { gameId, walletAddress: userAccount });
      
      setStatus("Bets locked successfully! Game can now begin.");
    } catch (error) {
      console.error("Error locking bets:", error);
      setStatus("Error locking bets. Please try again.");
    }
  };

  const handleResign = () => {
    if (!userAccount || !socket) {
      alert("Please connect your wallet first.");
      return;
    }

    if (confirm("Are you sure you want to resign? This will end the game and you will lose.")) {
      socket.emit('resign', { gameId, walletAddress: userAccount });
      setStatus("Resigning...");
    }
  };

  const handleOfferDraw = () => {
    if (!userAccount || !socket) {
      alert("Please connect your wallet first.");
      return;
    }

    socket.emit('offerDraw', { gameId, walletAddress: userAccount });
    setStatus("Draw offer sent to opponent...");
  };

  const handleRespondToDraw = (accepted: boolean) => {
    if (!userAccount || !socket) {
      alert("Please connect your wallet first.");
      return;
    }

    socket.emit('respondToDraw', { gameId, walletAddress: userAccount, accepted });
    setStatus(accepted ? "Draw accepted!" : "Draw declined.");
  };

  const handleAnalyzeGame = () => {
    navigate(`/analysis/${gameId}`);
  };

  function onDrop(sourceSquare: string, targetSquare: string) {
    // Spectators cannot make moves
    if (isSpectator) {
      return false;
    }

    if (!userAccount) {
      alert("Connect your wallet to play.");
      return false;
    }

    // Check if the player is assigned a color
    if (!playerColor) {
      alert("You haven't been assigned a color yet. Please join a game first.");
      return false;
    }

    // Get the piece at the source square
    const piece = game.get(sourceSquare as any);
    if (!piece) {
      return false; // No piece at source square
    }

    // Check if the piece belongs to the current player
    const pieceColor = piece.color === 'w' ? 'white' : 'black';
    if (pieceColor !== playerColor) {
      alert(`You can only move ${playerColor} pieces.`);
      return false;
    }

    // Check if it's the player's turn
    const currentTurn = game.turn() === 'w' ? 'white' : 'black';
    if (currentTurn !== playerColor) {
      alert("It's not your turn.");
      return false;
    }

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    };

    // Do not update the local game or fen here. Only emit to server.
    if (socket) {
      socket.emit('makeMove', { gameId, move, walletAddress: userAccount });
    }
    // Always return true to let the UI show the move, but the server will correct it if invalid.
    return true;
  }

  // Helper function to format time
  const formatTime = (timeMs: number): string => {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Determine board orientation based on player color
  const boardOrientation = playerColor === 'black' ? 'black' : 'white';

  // Game state for ChatBot
  const gameState = {
    isGameActive: activePlayer !== null,
    currentStakes,
    playerColor,
    gameOver,
    moveCount: moveHistory.length
  };

  const handleBetSuggestion = (amount: number) => {
    // This would trigger the betting interface
    console.log(`ChatBot suggested bet: ${amount} MAG`);
    setStatus(`ChatBot suggests betting ${amount} MAG!`);
  };

  return (
    <div className="game-container">
      {!isSpectator && (
        <>
          {!userAccount ? (
            <div className="wallet-required-section">
              <div className="wallet-warning">
                <p>⚠️ Wallet Required</p>
                <p>Please connect your wallet to start a new game</p>
              </div>
              <button disabled className="game-button disabled">
                Start New Game (Get ID)
              </button>
            </div>
          ) : (
            <button onClick={handleStartGame} className="game-button">
              Start New Game (Get ID)
            </button>
          )}
        </>
      )}
      
      <div className="game-board-section">
        <div className="board-with-timers">
          <div className="timer-side">
            <ChessTimer
              whiteTime={whiteTime}
              blackTime={blackTime}
              activePlayer={activePlayer}
              playerColor={playerColor}
            />
          </div>
          
          <div className="board-container">
            <ChessboardComponent
              position={fen} 
              onPieceDrop={onDrop}
              boardWidth={600}
              pieces={pieceSet}
              boardOrientation={boardOrientation}
              boardTheme={boardTheme}
            />
          </div>
        </div>
        
        <MoveHistory moves={moveHistory} />
      </div>
      
      {!isSpectator && (
        <ChatBot 
          gameState={gameState}
          onBetSuggestion={handleBetSuggestion}
          moveHistory={moveHistory}
        />
      )}
      
      {gameOver && (
        <div className="game-result">
          <p className="game-over-message">{gameOver}</p>
          <div className="game-actions">
            {!isSpectator && winner === playerColor && (
              <button onClick={handleClaimReward} className="game-button claim-button">
                Claim Reward (5 $MAG + Stakes)
              </button>
            )}
            {!isSpectator && winner && winner !== playerColor && (
              <p className="loser-message">Better luck next time!</p>
            )}
            <button onClick={handleAnalyzeGame} className="game-button analyze-button">
              Analyze Game
            </button>
          </div>
        </div>
      )}
      
      {!isSpectator && (
        <StakesPopup
          isOpen={showStakesPopup}
          onClose={() => setShowStakesPopup(false)}
          onConfirm={handleCreateGameWithStakes}
          currentStakes={currentStakes}
        />
      )}

      {/* Draw Offer Modal */}
      {!isSpectator && showDrawOffer && (
        <div className="draw-offer-modal">
          <div className="draw-offer-content">
            <h3>Draw Offer</h3>
            <p>{drawOfferFrom} has offered a draw. Do you accept?</p>
            <div className="draw-offer-buttons">
              <button 
                onClick={() => handleRespondToDraw(true)}
                className="draw-offer-btn accept-draw-btn"
              >
                Accept
              </button>
              <button 
                onClick={() => handleRespondToDraw(false)}
                className="draw-offer-btn decline-draw-btn"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-info">
        <div className="player-info">
          <div className={`player ${activePlayer === 'white' ? 'active' : ''}`}>
            <span className="player-color">⚪ White</span>
            <span className="player-time">{formatTime(whiteTime)}</span>
          </div>
          <div className={`player ${activePlayer === 'black' ? 'active' : ''}`}>
            <span className="player-color">⚫ Black</span>
            <span className="player-time">{formatTime(blackTime)}</span>
          </div>
        </div>
        
        {/* Game Control Buttons - Only for players */}
        {!isSpectator && !gameOver && activePlayer !== null && (
          <div className="game-controls">
            <div className="control-buttons">
              <button 
                onClick={handleResign}
                className="control-btn resign-btn"
                title="Resign the game"
              >
                🏳️ Resign
              </button>
              <button 
                onClick={handleOfferDraw}
                className="control-btn draw-btn"
                title="Offer a draw"
              >
                🤝 Offer Draw
              </button>
            </div>
          </div>
        )}
        
        {/* Betting Interface - Only for players */}
        {!isSpectator && !gameOver && currentStakes > 0 && (
          <div className="betting-interface">
            <h4>Place Your Bet</h4>
            <p>Stakes: {ethers.formatEther(currentStakes)} $MAG</p>
            <div className="bet-buttons">
              <button 
                onClick={() => handlePlaceBet(currentStakes, 'white')}
                className="bet-btn white-bet"
                disabled={activePlayer !== null}
              >
                Bet on White
              </button>
              <button 
                onClick={() => handlePlaceBet(currentStakes, 'black')}
                className="bet-btn black-bet"
                disabled={activePlayer !== null}
              >
                Bet on Black
              </button>
            </div>
            {activePlayer === null && (
              <button 
                onClick={handleLockBets}
                className="lock-bets-btn"
              >
                Lock Bets & Start Game
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
