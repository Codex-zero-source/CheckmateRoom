import React from 'react';
import { ethers } from 'ethers';

interface PotProps {
  amount: number; // Amount in wei
  isLocked: boolean;
}

const Pot: React.FC<PotProps> = ({ amount, isLocked }) => {
  const formatAmount = (weiAmount: number): string => {
    if (weiAmount === 0) return '0 $MAG';
    return `${ethers.formatEther(weiAmount)} $MAG`;
  };

  return (
    <div className="pot-container">
      <div className="pot-header">
        <h3>Game Pot</h3>
        {isLocked && <span className="locked-badge">🔒 Locked</span>}
      </div>
      
      <div className="pot-amount">
        <span className="amount-value">{formatAmount(amount)}</span>
      </div>
      
      <div className="pot-status">
        {amount === 0 ? (
          <p className="no-stakes">No stakes set</p>
        ) : isLocked ? (
          <p className="stakes-locked">Stakes locked - game in progress</p>
        ) : (
          <p className="stakes-open">Stakes can be modified</p>
        )}
      </div>
    </div>
  );
};

export default Pot; 