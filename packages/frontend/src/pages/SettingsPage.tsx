import React from 'react';
import { useTheme, pieceSets, boardThemes } from '../contexts/ThemeContext';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
    const { theme, setTheme, pieceSet, setPieceSet, boardTheme, setBoardTheme } = useTheme();

    const themes = [
        { id: 'neon', name: 'Neon', description: 'Vibrant neon colors' },
        { id: 'dracula', name: 'Dracula', description: 'Dark purple theme' },
        { id: 'classic', name: 'Classic', description: 'Traditional blue' },
        { id: 'cyberpunk', name: 'Cyberpunk', description: 'Futuristic red/cyan' },
        { id: 'midnight', name: 'Midnight', description: 'Deep purple/blue' },
    ];

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme as any);
    };

    const handlePieceSetChange = (newPieceSet: string) => {
        setPieceSet(newPieceSet);
    };

    const handleBoardThemeChange = (newBoardTheme: string) => {
        setBoardTheme(newBoardTheme);
    };

    return (
        <div className="settings-page">
            <div className="settings-container">
                <h1 className="settings-title">Settings</h1>
                
                {/* Theme Customization */}
                <div className="settings-section">
                    <h2 className="section-title">Theme</h2>
                    <div className="theme-options">
                        {themes.map((themeOption) => (
                            <div
                                key={themeOption.id}
                                className={`theme-option ${theme === themeOption.id ? 'selected' : ''}`}
                                onClick={() => handleThemeChange(themeOption.id)}
                            >
                                <div className="theme-preview" data-theme={themeOption.id}></div>
                                <div className="theme-info">
                                    <span className="theme-name">{themeOption.name}</span>
                                    <span className="theme-description">{themeOption.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chess Pieces Customization */}
                <div className="settings-section">
                    <h2 className="section-title">Chess Pieces</h2>
                    <div className="piece-options">
                        {pieceSets.map((piece) => (
                            <button
                                key={piece}
                                className={`piece-option ${pieceSet === piece ? 'selected' : ''}`}
                                onClick={() => handlePieceSetChange(piece)}
                            >
                                {piece.charAt(0).toUpperCase() + piece.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Board Style Customization */}
                <div className="settings-section">
                    <h2 className="section-title">Board Style</h2>
                    <div className="board-options">
                        {boardThemes.map((board) => (
                            <button
                                key={board}
                                className={`board-option ${boardTheme === board ? 'selected' : ''}`}
                                onClick={() => handleBoardThemeChange(board)}
                            >
                                {board.charAt(0).toUpperCase() + board.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage; 