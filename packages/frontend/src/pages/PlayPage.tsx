import { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import Game from '../components/Chessboard';
import GameInfo from '../components/GameInfo';
import Customization from '../components/Customization';

interface PlayPageProps {
    chessGameContract: Contract | null;
    userAccount: string | null;
}

const PlayPage = ({ chessGameContract, userAccount }: PlayPageProps) => {
    const [gameId, setGameId] = useState<number | null>(null);
    const [status, setStatus] = useState('');
    const [gameOver, setGameOver] = useState('');
    const [pieceSet, setPieceSet] = useState('default');

    return (
        <div className="main-content">
            <Game 
                chessGameContract={chessGameContract} 
                userAccount={userAccount} 
                setGameId={setGameId}
                setStatus={setStatus}
                setGameOver={setGameOver}
                pieceSet={pieceSet}
            />
            <div className="side-panel">
                <GameInfo 
                    gameId={gameId}
                    status={status}
                    gameOver={gameOver}
                />
                <Customization setPieceSet={setPieceSet} />
            </div>
        </div>
    );
};

export default PlayPage; 