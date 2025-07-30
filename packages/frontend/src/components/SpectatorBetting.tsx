import React, { useState } from 'react';
import { ethers } from 'ethers';

interface SpectatorBettingProps {
    gameId: string;
    chessGameContract: ethers.Contract | null;
    userAccount: string | null;
    totalWhiteBets: number;
    totalBlackBets: number;
    betsLocked: boolean;
}

const SpectatorBetting: React.FC<SpectatorBettingProps> = ({
    gameId,
    chessGameContract,
    userAccount,
    totalWhiteBets,
    totalBlackBets,
    betsLocked
}) => {
    const [betAmount, setBetAmount] = useState('');
    const [betOnWhite, setBetOnWhite] = useState(true);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const handlePlaceBet = async () => {
        if (!chessGameContract || !userAccount || !betAmount) {
            setError('Please connect your wallet and enter a bet amount.');
            return;
        }

        setStatus('Placing bet...');
        setError('');

        try {
            const amountInWei = ethers.parseUnits(betAmount, 18);
            const tx = await chessGameContract.placeSpectatorBet(gameId, betOnWhite, { value: amountInWei });
            await tx.wait();
            setStatus('Bet placed successfully!');
        } catch (err: any) {
            console.error('Betting failed:', err);
            setError(err.reason || 'An unknown error occurred.');
            setStatus('');
        }
    };

    return (
        <div className="spectator-betting">
            <h3>Place Your Bet</h3>
            {betsLocked ? (
                <p>Bets are locked for this game.</p>
            ) : (
                <>
                    <div className="betting-pools">
                        <p>White Pool: {ethers.formatUnits(totalWhiteBets, 18)} STT</p>
                        <p>Black Pool: {ethers.formatUnits(totalBlackBets, 18)} STT</p>
                    </div>
                    <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="Amount in STT"
                        disabled={!userAccount}
                    />
                    <div className="bet-selection">
                        <button
                            onClick={() => setBetOnWhite(true)}
                            className={betOnWhite ? 'active' : ''}
                        >
                            Bet on White
                        </button>
                        <button
                            onClick={() => setBetOnWhite(false)}
                            className={!betOnWhite ? 'active' : ''}
                        >
                            Bet on Black
                        </button>
                    </div>
                    <button onClick={handlePlaceBet} disabled={!userAccount || !betAmount}>
                        Place Bet
                    </button>
                    {status && <p className="status">{status}</p>}
                    {error && <p className="error">{error}</p>}
                </>
            )}
        </div>
    );
};

export default SpectatorBetting;
