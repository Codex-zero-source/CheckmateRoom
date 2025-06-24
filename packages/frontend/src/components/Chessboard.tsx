import { useMemo, useState } from 'react';
import type { FC, Dispatch, SetStateAction } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Contract } from 'ethers';

// Explicitly type the Chessboard component to resolve the JSX issue
const ChessboardComponent: FC<any> = Chessboard as any;

interface GameProps {
  chessGameContract: Contract | null;
  userAccount: string | null;
  setGameId: Dispatch<SetStateAction<number | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setGameOver: Dispatch<SetStateAction<string>>;
  pieceSet: string;
}

// A dummy opponent for demonstration purposes
const DUMMY_OPPONENT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export default function Game({ 
  chessGameContract, 
  userAccount, 
  setGameId, 
  setStatus, 
  setGameOver, 
  pieceSet 
}: GameProps) {
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());
  const [winner, setWinner] = useState('');

  const handleStartGame = async () => {
    if (!chessGameContract || !userAccount) {
      alert("Please connect your wallet first.");
      return;
    }
    setStatus("Creating game on the blockchain...");
    try {
      const tx = await chessGameContract.createGame(userAccount, DUMMY_OPPONENT_ADDRESS);
      
      // Wait for the transaction to be mined and get the receipt
      const receipt = await tx.wait();

      // Find the GameCreated event in the transaction receipt
      const gameCreatedEvent = receipt.logs.find((e: any) => e.fragment && e.fragment.name === 'GameCreated');
      
      if (gameCreatedEvent) {
        const newGameId = gameCreatedEvent.args.gameId;
        setGameId(newGameId);
        setStatus(`Game #${newGameId} started! Your move.`);
        game.reset();
        setFen(game.fen());
        setGameOver('');
      } else {
        setStatus("Could not find GameCreated event.");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      setStatus("Error creating game. See console for details.");
    }
  };
  
  const handleClaimReward = async () => {
    if (!chessGameContract || !userAccount) {
      alert("No active game or wallet not connected.");
      return;
    }
    // This needs the gameId from the parent now
    const gameId = await chessGameContract.nextGameId() - 1; // A simple way to get it for now

    const winnerAddress = winner === 'w' ? userAccount : DUMMY_OPPONENT_ADDRESS;

    setStatus("Claiming reward from the blockchain...");
    try {
      const tx = await chessGameContract.reportWinner(gameId, winnerAddress);
      await tx.wait();
      setStatus(`Reward claimed for Game #${gameId}!`);
      setGameOver('');
    } catch (error) {
      console.error("Error claiming reward:", error);
      setStatus("Error claiming reward. See console for details.");
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (!userAccount) {
      alert("Connect your wallet to play.");
      return false;
    }
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;

      setFen(game.fen());
      
      if (game.isGameOver()) {
        const newWinner = game.turn() === 'w' ? 'Black' : 'White';
        setWinner(game.turn());
        if (game.isCheckmate()) {
          setGameOver(`Checkmate! ${newWinner} wins.`);
        } else if (game.isDraw()) {
          setGameOver("It's a draw!");
        }
      }

      return true;
    } catch (error) {
      console.warn("Invalid move:", error);
      return false;
    }
  }

  return (
    <div className="game-container">
      {!userAccount ? (
        <p>Connect your wallet to play.</p>
      ) : (
        <>
            <button onClick={handleStartGame} className="game-button">
                Start New Game
            </button>
            <div className="board-container">
              <ChessboardComponent
                position={fen} 
                onPieceDrop={onDrop}
                boardWidth={600}
                pieces={pieceSet}
              />
            </div>
            {/* The claim reward button is now part of the GameInfo component implicitly */}
        </>
      )}
    </div>
  );
} 