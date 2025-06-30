import React, { useState } from 'react';
import { ethers } from 'ethers';

interface StakesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  currentStakes?: number;
}

const StakesPopup: React.FC<StakesPopupProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentStakes = 0 
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(currentStakes);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const predefinedAmounts = [10, 20, 50, 100];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(ethers.parseEther(value));
    }
  };

  const handleConfirm = () => {
    if (selectedAmount > 0) {
      onConfirm(selectedAmount);
      onClose();
    }
  };

  const handleCustomToggle = () => {
    setIsCustom(!isCustom);
    if (!isCustom) {
      setSelectedAmount(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="stakes-popup-overlay">
      <div className="stakes-popup">
        <div className="stakes-popup-header">
          <h3>Set Game Stakes</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="stakes-popup-content">
          <p className="stakes-description">
            Choose the amount of $MAG tokens to stake for this game. 
            The winner takes the pot!
          </p>
          
          <div className="stakes-options">
            {predefinedAmounts.map((amount) => (
              <button
                key={amount}
                className={`stake-option ${selectedAmount === ethers.parseEther(amount.toString()) && !isCustom ? 'selected' : ''}`}
                onClick={() => handleAmountSelect(ethers.parseEther(amount.toString()))}
              >
                {amount} $MAG
              </button>
            ))}
            
            <button
              className={`stake-option custom ${isCustom ? 'selected' : ''}`}
              onClick={handleCustomToggle}
            >
              Custom
            </button>
          </div>
          
          {isCustom && (
            <div className="custom-amount-input">
              <label htmlFor="customAmount">Custom Amount ($MAG):</label>
              <input
                id="customAmount"
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter amount..."
              />
            </div>
          )}
          
          {selectedAmount > 0 && (
            <div className="selected-stakes">
              <p>Selected stakes: <strong>{ethers.formatEther(selectedAmount)} $MAG</strong></p>
            </div>
          )}
        </div>
        
        <div className="stakes-popup-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="confirm-button" 
            onClick={handleConfirm}
            disabled={selectedAmount <= 0}
          >
            Set Stakes
          </button>
        </div>
      </div>
    </div>
  );
};

export default StakesPopup; 