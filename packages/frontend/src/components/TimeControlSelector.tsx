import React, { useState } from 'react';
import { TIME_CONTROL_OPTIONS, STAKES_OPTIONS } from '../config/env';
import './TimeControlSelector.css';

interface TimeControlSelectorProps {
    onGameCreate: (timeControl: number, increment: number, stakes: number) => void;
    isCreating: boolean;
}

const TimeControlSelector: React.FC<TimeControlSelectorProps> = ({
    onGameCreate,
    isCreating
}) => {
    const [selectedTimeControl, setSelectedTimeControl] = useState<number>(5);
    const [selectedIncrement, setSelectedIncrement] = useState<number>(0);
    const [selectedStakes, setSelectedStakes] = useState<number>(0);

    const handleTimeControlSelect = (timeControl: number, increment: number) => {
        setSelectedTimeControl(timeControl);
        setSelectedIncrement(increment);
    };

    const handleStakesSelect = (stakes: number) => {
        setSelectedStakes(stakes);
    };

    const handleCreateGame = () => {
        onGameCreate(selectedTimeControl, selectedIncrement, selectedStakes);
    };

    const formatStakes = (stakes: number): string => {
        if (stakes === 0) return 'No Stakes';
        return `${stakes} MAG`;
    };

    return (
        <div className="time-control-selector">
            <div className="selector-header">
                <h3>🎮 Create New Game</h3>
                <p>Select your preferred time control and stakes to start a new game</p>
            </div>

            <div className="selector-sections">
                {/* Time Control Selection */}
                <div className="section">
                    <h4>⏱️ Time Control</h4>
                    <div className="time-control-grid">
                        {TIME_CONTROL_OPTIONS.map((option, index) => (
                            <button
                                key={index}
                                className={`time-control-option ${
                                    selectedTimeControl === option.value && 
                                    selectedIncrement === option.increment ? 'selected' : ''
                                }`}
                                onClick={() => handleTimeControlSelect(option.value, option.increment)}
                                disabled={isCreating}
                            >
                                <span className="time-label">{option.label}</span>
                                <span className="time-details">
                                    {option.value} min{option.increment > 0 ? ` + ${option.increment}s` : ''}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stakes Selection */}
                <div className="section">
                    <h4>💰 Stakes</h4>
                    <div className="stakes-grid">
                        {STAKES_OPTIONS.map((option, index) => (
                            <button
                                key={index}
                                className={`stakes-option ${
                                    selectedStakes === option.value ? 'selected' : ''
                                }`}
                                onClick={() => handleStakesSelect(option.value)}
                                disabled={isCreating}
                            >
                                <span className="stakes-label">{option.label}</span>
                                {option.value > 0n && (
                                    <span className="stakes-amount">{formatStakes(option.value)}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create Game Button */}
            <div className="create-game-section">
                <button
                    className={`create-game-btn ${isCreating ? 'creating' : ''}`}
                    onClick={handleCreateGame}
                    disabled={isCreating}
                >
                    {isCreating ? (
                        <>
                            <span className="loading-spinner"></span>
                            Creating Game...
                        </>
                    ) : (
                        <>
                            <span className="create-icon">🎯</span>
                            Create Game
                        </>
                    )}
                </button>
                
                <div className="game-summary">
                    <div className="summary-item">
                        <span className="label">Time Control:</span>
                        <span className="value">
                            {selectedTimeControl} min{selectedIncrement > 0 ? ` + ${selectedIncrement}s` : ''}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Stakes:</span>
                        <span className="value">{formatStakes(selectedStakes)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeControlSelector; 