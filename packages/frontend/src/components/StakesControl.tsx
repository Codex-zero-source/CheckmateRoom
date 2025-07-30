import React, { useState } from 'react';
import { ethers } from 'ethers';

interface StakesControlProps {
  onStakesChange: (amount: number) => void;
  currentStakes: number;
  gameId: string | null;
}

const StakesControl: React.FC<StakesControlProps> = ({ onStakesChange, currentStakes, gameId }) => {
  const [customAmount, setCustomAmount] = useState('');
  
  const presetAmounts = [
    { label: 'No Stakes', value: 0 },
    { label: '10 STT', value: ethers.parseEther('10') },
    { label: '50 STT', value: ethers.parseEther('50') },
    { label: '100 STT', value: ethers.parseEther('100') },
    { label: '250 STT', value: ethers.parseEther('250') },
    { label: '500 STT', value: ethers.parseEther('500') },
    { label: '1000 STT', value: ethers.parseEther('1000') }
  ];

  const handleCustomAmount = () => {
    try {
      const amount = ethers.parseEther(customAmount);
      onStakesChange(Number(amount));
      setCustomAmount('');
    } catch (error) {
      alert('Please enter a valid STT token amount');
    }
  };

  const formatStakes = (stakes: number): string => {
    if (stakes === 0) return 'No stakes';
    return `${ethers.formatEther(stakes)} STT`;
  };

  return (
    <div className="stakes-control">
      <h3>Game Stakes (STT)</h3>
      <div className="current-stakes">
        <span className="label">Current Stakes:</span>
        <span className="value">{formatStakes(currentStakes)}</span>
      </div>
      
      {gameId && (
        <div className="stakes-options">
          <h4>Set Stakes</h4>
          <div className="preset-amounts">
            {presetAmounts.map((preset) => (
              <button
                key={preset.value}
                className={`stakes-option ${currentStakes === preset.value ? 'selected' : ''}`}
                onClick={() => onStakesChange(Number(preset.value))}
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          <div className="custom-amount">
            <input
              type="text"
              placeholder="Custom amount (STT)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <button onClick={handleCustomAmount}>Set</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StakesControl;
